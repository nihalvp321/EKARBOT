-- Update user manager credentials
UPDATE app_users 
SET email = 'mitesolutions@gmail.com', 
    password_hash = 'Mite@123',
    username = 'mitesolutions'
WHERE user_type = 'user_manager';