import db from '../../db.js';

export const getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const q = `
            SELECT m.*, u.name as sender_name, u.role as sender_role 
            FROM internal_messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.receiver_id = ?
            ORDER BY m.created_at DESC
        `;
        const [rows] = await db.query(q, [userId]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiver_id, message } = req.body;

        if (!receiver_id || !message) {
            return res.status(400).json({ message: "Receiver ID and message are required." });
        }

        const q = "INSERT INTO internal_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)";
        await db.query(q, [senderId, receiver_id, message]);

        res.status(201).json({ message: "Message sent successfully!" });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user.id;

        await db.query("UPDATE internal_messages SET is_read = TRUE WHERE id = ? AND receiver_id = ?", [messageId, userId]);
        res.json({ message: "Marked as read." });
    } catch (error) {
        console.error("Error marking message as read:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
