import db from '../../db.js';

// Get contacts the user is allowed to message
export const getContacts = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        let contacts = [];

        if (role === 'employee') {
            // Employee can message their manager and Admin Pool
            const [managerRows] = await db.query(`
                SELECT u.id, u.name, u.role, u.profile_picture, d_u.name as department_name, des_u.title as designation_title
                FROM users u 
                LEFT JOIN departments d_u ON u.department_id = d_u.id
                LEFT JOIN designations des_u ON u.designation_id = des_u.id
                JOIN departments d ON u.id = d.manager_id 
                JOIN users emp ON emp.department_id = d.id 
                WHERE emp.id = ?
            `, [userId]);
            contacts = [...managerRows];
            contacts.push({ id: 'admin_pool', name: 'Admin Support', role: 'admin', profile_picture: null });
        } else if (role === 'manager') {
            // Manager can message employees in their dept, other managers, and Admin Pool
            const [deptRows] = await db.query(`
                SELECT u.id, u.name, u.role, u.profile_picture, d_u.name as department_name, des_u.title as designation_title
                FROM users u 
                LEFT JOIN departments d_u ON u.department_id = d_u.id
                LEFT JOIN designations des_u ON u.designation_id = des_u.id
                WHERE u.department_id = (SELECT department_id FROM users WHERE id = ?) AND u.id != ?
            `, [userId, userId]);
            
            const [otherManagers] = await db.query(`
                SELECT u.id, u.name, u.role, u.profile_picture, d_u.name as department_name, des_u.title as designation_title 
                FROM users u
                LEFT JOIN departments d_u ON u.department_id = d_u.id
                LEFT JOIN designations des_u ON u.designation_id = des_u.id
                WHERE u.role = 'manager' AND u.id != ?
            `, [userId]);

            contacts = [...deptRows, ...otherManagers];
            contacts.push({ id: 'admin_pool', name: 'Admin Support', role: 'admin', profile_picture: null });
        } else if (role === 'admin') {
            // Admin can message anyone
            const [allUsers] = await db.query(`
                SELECT u.id, u.name, u.role, u.profile_picture, d_u.name as department_name, des_u.title as designation_title 
                FROM users u
                LEFT JOIN departments d_u ON u.department_id = d_u.id
                LEFT JOIN designations des_u ON u.designation_id = des_u.id
                WHERE u.id != ?
            `, [userId]);
            contacts = [...allUsers];
            // Also add Admin Support so admins can see the pool messages
            contacts.push({ id: 'admin_pool', name: 'Global Admin Inbox', role: 'admin', profile_picture: null });
        }

        // Deduplicate
        const uniqueContacts = Array.from(new Map(contacts.map(c => [c.id, c])).values());
        res.json(uniqueContacts);
    } catch (error) {
        console.error("Error fetching contacts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get conversations (latest message per contact + unread count)
export const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        
        // This query fetches the latest message and unread count per user
        // We will do a simplified version: just fetch all messages for the user, then group in JS
        const q = `
            SELECT m.*, 
                   sender.name as sender_name, sender.role as sender_role, sender.profile_picture as sender_avatar,
                   s_dept.name as sender_dept, s_des.title as sender_desig,
                   receiver.name as receiver_name, receiver.role as receiver_role, receiver.profile_picture as receiver_avatar,
                   r_dept.name as receiver_dept, r_des.title as receiver_desig
            FROM internal_messages m
            LEFT JOIN users sender ON m.sender_id = sender.id
            LEFT JOIN departments s_dept ON sender.department_id = s_dept.id
            LEFT JOIN designations s_des ON sender.designation_id = s_des.id
            LEFT JOIN users receiver ON m.receiver_id = receiver.id
            LEFT JOIN departments r_dept ON receiver.department_id = r_dept.id
            LEFT JOIN designations r_des ON receiver.designation_id = r_des.id
            WHERE m.sender_id = ? OR m.receiver_id = ? OR (? = 'admin' AND (m.target_role = 'admin' OR sender.role = 'admin' OR receiver.role = 'admin'))
            ORDER BY m.created_at DESC
        `;
        const [rows] = await db.query(q, [userId, userId, role]);
        
        const conversations = {};
        
        rows.forEach(msg => {
            let otherId;
            let otherName;
            let otherRole;
            let otherAvatar;
            
            let otherDept;
            let otherDesig;
            
            if (msg.target_role === 'admin' && msg.receiver_id === null) {
                // It's a pool message
                if (role === 'admin') {
                    // Admins see it as a chat from the sender to the Pool
                    otherId = msg.sender_id === userId ? 'admin_pool' : msg.sender_id;
                    otherName = msg.sender_id === userId ? 'Global Admin Inbox' : msg.sender_name;
                    otherRole = msg.sender_id === userId ? 'admin' : msg.sender_role;
                    otherAvatar = msg.sender_id === userId ? null : msg.sender_avatar;
                    otherDept = msg.sender_id === userId ? null : msg.sender_dept;
                    otherDesig = msg.sender_id === userId ? null : msg.sender_desig;
                } else {
                    // Employee/Manager sees it as Admin Pool
                    otherId = 'admin_pool';
                    otherName = 'Admin Support';
                    otherRole = 'admin';
                    otherAvatar = null;
                    otherDept = null;
                    otherDesig = null;
                }
            } else {
                if (msg.sender_id === userId) {
                    if (role !== 'admin' && msg.receiver_role === 'admin') {
                        otherId = 'admin_pool';
                        otherName = 'Admin Support';
                        otherRole = 'admin';
                        otherAvatar = null;
                        otherDept = null;
                        otherDesig = null;
                    } else {
                        otherId = msg.receiver_id;
                        otherName = msg.receiver_name;
                        otherRole = msg.receiver_role;
                        otherAvatar = msg.receiver_avatar;
                        otherDept = msg.receiver_dept;
                        otherDesig = msg.receiver_desig;
                    }
                } else if (msg.receiver_id === userId) {
                    if (role !== 'admin' && msg.sender_role === 'admin') {
                        otherId = 'admin_pool';
                        otherName = 'Admin Support';
                        otherRole = 'admin';
                        otherAvatar = null;
                        otherDept = null;
                        otherDesig = null;
                    } else {
                        otherId = msg.sender_id;
                        otherName = msg.sender_name;
                        otherRole = msg.sender_role;
                        otherAvatar = msg.sender_avatar;
                        otherDept = msg.sender_dept;
                        otherDesig = msg.sender_desig;
                    }
                } else if (role === 'admin') {
                    // Admin viewing a message between another admin and a user
                    if (msg.sender_role === 'admin') {
                        otherId = msg.receiver_id;
                        otherName = msg.receiver_name;
                        otherRole = msg.receiver_role;
                        otherAvatar = msg.receiver_avatar;
                        otherDept = msg.receiver_dept;
                        otherDesig = msg.receiver_desig;
                    } else {
                        otherId = msg.sender_id;
                        otherName = msg.sender_name;
                        otherRole = msg.sender_role;
                        otherAvatar = msg.sender_avatar;
                        otherDept = msg.sender_dept;
                        otherDesig = msg.sender_desig;
                    }
                }
            }
            
            if (!conversations[otherId]) {
                conversations[otherId] = {
                    id: otherId,
                    name: otherName,
                    role: otherRole,
                    profile_picture: otherAvatar,
                    department: otherDept,
                    designation: otherDesig,
                    latest_message: msg.message,
                    created_at: msg.created_at,
                    unread_count: 0
                };
            }
            
            // Increment unread count if we are the receiver and it's unread
            if (!msg.is_read && ((msg.receiver_id === userId) || (msg.target_role === 'admin' && role === 'admin' && msg.sender_id !== userId))) {
                conversations[otherId].unread_count += 1;
            }
        });
        
        res.json(Object.values(conversations));
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get specific chat history
export const getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const otherId = req.params.otherId; // can be 'admin_pool' or a user ID
        
        let q, params;
        if (otherId === 'admin_pool') {
            if (role === 'admin') {
                q = `
                    SELECT m.*, u.name as sender_name, u.role as sender_role, u.profile_picture as sender_avatar,
                           d.name as sender_dept, des.title as sender_desig
                    FROM internal_messages m
                    JOIN users u ON m.sender_id = u.id
                    LEFT JOIN departments d ON u.department_id = d.id
                    LEFT JOIN designations des ON u.designation_id = des.id
                    WHERE m.target_role = 'admin' AND m.receiver_id IS NULL
                    ORDER BY m.created_at ASC
                `;
                params = [];
            } else {
                q = `
                    SELECT m.*, 
                           sender.name as sender_name, sender.role as sender_role, sender.profile_picture as sender_avatar,
                           d.name as sender_dept, des.title as sender_desig
                    FROM internal_messages m
                    JOIN users sender ON m.sender_id = sender.id
                    LEFT JOIN departments d ON sender.department_id = d.id
                    LEFT JOIN designations des ON sender.designation_id = des.id
                    WHERE (m.sender_id = ? AND m.target_role = 'admin') 
                       OR (m.receiver_id = ? AND sender.role = 'admin')
                    ORDER BY m.created_at ASC
                `;
                params = [userId, userId];
            }
        } else {
            if (role === 'admin') {
                // Determine other user's role to handle grouping correctly
                const [otherUserRows] = await db.query('SELECT role FROM users WHERE id = ?', [otherId]);
                const otherRole = otherUserRows[0]?.role;

                if (otherRole === 'admin') {
                    // Admin to Admin is private
                    q = `
                        SELECT m.*, 
                               sender.name as sender_name, sender.role as sender_role, sender.profile_picture as sender_avatar,
                               d.name as sender_dept, des.title as sender_desig
                        FROM internal_messages m
                        JOIN users sender ON m.sender_id = sender.id
                        LEFT JOIN departments d ON sender.department_id = d.id
                        LEFT JOIN designations des ON sender.designation_id = des.id
                        WHERE (m.sender_id = ? AND m.receiver_id = ?)
                           OR (m.sender_id = ? AND m.receiver_id = ?)
                        ORDER BY m.created_at ASC
                    `;
                    params = [userId, otherId, otherId, userId];
                } else {
                    // Admin to Employee/Manager: Show ALL messages between this user and ANY admin (or pool)
                    q = `
                        SELECT m.*, 
                               sender.name as sender_name, sender.role as sender_role, sender.profile_picture as sender_avatar,
                               d.name as sender_dept, des.title as sender_desig
                        FROM internal_messages m
                        JOIN users sender ON m.sender_id = sender.id
                        LEFT JOIN users receiver ON m.receiver_id = receiver.id
                        LEFT JOIN departments d ON sender.department_id = d.id
                        LEFT JOIN designations des ON sender.designation_id = des.id
                        WHERE (m.sender_id = ? AND receiver.role = 'admin')
                           OR (m.receiver_id = ? AND sender.role = 'admin')
                           OR (m.sender_id = ? AND m.target_role = 'admin' AND m.receiver_id IS NULL)
                        ORDER BY m.created_at ASC
                    `;
                    params = [otherId, otherId, otherId];
                }
            } else {
                q = `
                    SELECT m.*, 
                           sender.name as sender_name, sender.role as sender_role, sender.profile_picture as sender_avatar,
                           d.name as sender_dept, des.title as sender_desig
                    FROM internal_messages m
                    JOIN users sender ON m.sender_id = sender.id
                    LEFT JOIN departments d ON sender.department_id = d.id
                    LEFT JOIN designations des ON sender.designation_id = des.id
                    WHERE (m.sender_id = ? AND m.receiver_id = ?)
                       OR (m.sender_id = ? AND m.receiver_id = ?)
                    ORDER BY m.created_at ASC
                `;
                params = [userId, otherId, otherId, userId];
            }
        }
        
        const [rows] = await db.query(q, params);
        
        // Mask admin identities if the current user is not an admin
        if (role !== 'admin') {
            rows.forEach(row => {
                if (row.sender_role === 'admin') {
                    row.sender_name = 'Admin Support';
                    row.sender_avatar = null;
                }
            });
        }
        
        res.json(rows);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiver_id, message } = req.body;

        if (!message) {
            return res.status(400).json({ message: "Message is required." });
        }

        if (receiver_id === 'admin_pool') {
            const q = "INSERT INTO internal_messages (sender_id, receiver_id, target_role, message) VALUES (?, NULL, 'admin', ?)";
            await db.query(q, [senderId, message]);
        } else {
            const q = "INSERT INTO internal_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)";
            await db.query(q, [senderId, receiver_id, message]);
        }

        res.status(201).json({ message: "Message sent successfully!" });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const otherId = req.params.otherId;

        if (otherId === 'admin_pool' && role === 'admin') {
            // Admin marking pool messages as read
            await db.query("UPDATE internal_messages SET is_read = TRUE WHERE target_role = 'admin' AND receiver_id IS NULL");
        } else if (otherId === 'admin_pool') {
            // Employee marking admin replies as read
            await db.query(`
                UPDATE internal_messages m
                JOIN users sender ON m.sender_id = sender.id
                SET m.is_read = TRUE 
                WHERE m.receiver_id = ? AND sender.role = 'admin'
            `, [userId]);
        } else {
            // Normal 1-on-1 read receipt
            // Also mark any pool messages from this otherId as read if we are admin
            if (role === 'admin') {
                await db.query("UPDATE internal_messages SET is_read = TRUE WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND target_role = 'admin' AND receiver_id IS NULL)", [otherId, userId, otherId]);
            } else {
                await db.query("UPDATE internal_messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ?", [otherId, userId]);
            }
        }
        res.json({ message: "Marked as read." });
    } catch (error) {
        console.error("Error marking message as read:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        
        let q, params;
        if (role === 'admin') {
            q = `
                SELECT COUNT(*) as unread_count 
                FROM internal_messages 
                WHERE is_read = FALSE AND (receiver_id = ? OR (target_role = 'admin' AND sender_id != ?))
            `;
            params = [userId, userId];
        } else {
            q = `
                SELECT COUNT(*) as unread_count 
                FROM internal_messages 
                WHERE is_read = FALSE AND receiver_id = ?
            `;
            params = [userId];
        }
        
        const [[{ unread_count }]] = await db.query(q, params);
        res.json({ unreadCount: parseInt(unread_count) || 0 });
    } catch (error) {
        console.error("Error fetching unread count:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
