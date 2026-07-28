import { body, param, validationResult } from 'express-validator';

// Middleware to check validation results and return errors
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }
    next();
};

// Auth validations
export const loginRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required.')
        .isEmail().withMessage('Please provide a valid email address.'),
    body('password')
        .notEmpty().withMessage('Password is required.')
];

export const changePasswordRules = [
    body('oldPassword')
        .notEmpty().withMessage('Current password is required.'),
    body('newPassword')
        .notEmpty().withMessage('New password is required.')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long.')
];

// Leave request validations
export const applyLeaveRules = [
    body('type_id')
        .notEmpty().withMessage('Leave type is required.')
        .isInt({ min: 1, max: 3 }).withMessage('Invalid leave type.'),
    body('start_date')
        .notEmpty().withMessage('Start date is required.')
        .isDate().withMessage('Start date must be a valid date.'),
    body('end_date')
        .notEmpty().withMessage('End date is required.')
        .isDate().withMessage('End date must be a valid date.')
        .custom((value, { req }) => {
            if (new Date(value) < new Date(req.body.start_date)) {
                throw new Error('End date cannot be before start date.');
            }
            return true;
        }),
    body('reason')
        .trim()
        .notEmpty().withMessage('Reason is required.')
        .isLength({ max: 500 }).withMessage('Reason must be under 500 characters.')
];

export const editLeaveRules = [
    param('request_id')
        .isInt({ min: 1 }).withMessage('Invalid request ID.'),
    ...applyLeaveRules
];

export const cancelLeaveRules = [
    param('request_id')
        .isInt({ min: 1 }).withMessage('Invalid request ID.')
];

// Admin validations
export const updateStatusRules = [
    param('request_id')
        .isInt({ min: 1 }).withMessage('Invalid request ID.'),
    body('status')
        .notEmpty().withMessage('Status is required.')
        .isIn(['approved', 'rejected']).withMessage('Status must be either "approved" or "rejected".')
];

export const createUserRules = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required.')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required.')
        .isEmail().withMessage('Please provide a valid email address.'),
    body('role')
        .notEmpty().withMessage('Role is required.')
        .isIn(['employee', 'manager']).withMessage('Role must be either "employee" or "manager".'),
    body('total_leave_balance')
        .optional()
        .isInt({ min: 0, max: 20 }).withMessage('Leave balance must be between 0 and 20.')
];
