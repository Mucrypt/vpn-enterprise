-- Sample data setup for VPN Enterprise Database Platform
-- This script creates sample schemas and tables for testing

-- Create sample schemas
CREATE SCHEMA IF NOT EXISTS blog;
CREATE SCHEMA IF NOT EXISTS ecommerce;

-- Blog schema tables
CREATE TABLE IF NOT EXISTS blog.posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    author_id INTEGER,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blog.comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES blog.posts(id),
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(255),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blog.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ecommerce schema tables
CREATE TABLE IF NOT EXISTS ecommerce.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    stock_quantity INTEGER DEFAULT 0,
    category_id INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ecommerce.orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    customer_email VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ecommerce.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES ecommerce.orders(id),
    product_id INTEGER REFERENCES ecommerce.products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Add comments for better documentation
COMMENT ON SCHEMA blog IS 'Blog content management system';
COMMENT ON SCHEMA ecommerce IS 'E-commerce product and order management';

COMMENT ON TABLE blog.posts IS 'Blog posts and articles';
COMMENT ON TABLE blog.comments IS 'User comments on blog posts';
COMMENT ON TABLE blog.categories IS 'Blog post categories and tags';

COMMENT ON TABLE ecommerce.products IS 'Product catalog with inventory';
COMMENT ON TABLE ecommerce.orders IS 'Customer orders and transactions';
COMMENT ON TABLE ecommerce.order_items IS 'Individual items within orders';

-- Insert sample data
INSERT INTO blog.categories (name, slug, description) VALUES
('Technology', 'technology', 'Posts about technology and programming'),
('Business', 'business', 'Business insights and strategies'),
('Tutorials', 'tutorials', 'Step-by-step guides and tutorials')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog.posts (title, content, author_id, status, published_at) VALUES
('Getting Started with PostgreSQL', 'PostgreSQL is a powerful, open-source relational database...', 1, 'published', CURRENT_TIMESTAMP - INTERVAL '7 days'),
('Building Scalable APIs', 'When building APIs for production, scalability is crucial...', 1, 'published', CURRENT_TIMESTAMP - INTERVAL '3 days'),
('Database Design Best Practices', 'Good database design is the foundation of any successful application...', 2, 'published', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('Introduction to SQL', 'SQL (Structured Query Language) is the standard language...', 2, 'draft', NULL),
('Advanced Database Optimization', 'As your application grows, database performance becomes critical...', 1, 'published', CURRENT_TIMESTAMP - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

INSERT INTO blog.comments (post_id, author_name, author_email, content, status) VALUES
(1, 'John Doe', 'john@example.com', 'Great introduction to PostgreSQL!', 'approved'),
(1, 'Jane Smith', 'jane@example.com', 'Very helpful tutorial, thanks!', 'approved'),
(2, 'Mike Wilson', 'mike@example.com', 'Could you cover authentication in APIs next?', 'approved'),
(3, 'Sarah Johnson', 'sarah@example.com', 'The normalization examples were excellent.', 'approved'),
(2, 'Tom Brown', 'tom@example.com', 'Looking forward to more API content!', 'approved')
ON CONFLICT DO NOTHING;

INSERT INTO ecommerce.products (name, description, price, sku, stock_quantity, status) VALUES
('Laptop Pro 15"', 'High-performance laptop with 16GB RAM and 512GB SSD', 1299.99, 'LAP-PRO-15', 25, 'active'),
('Wireless Mouse', 'Ergonomic wireless mouse with precision tracking', 29.99, 'MOUSE-WL-01', 150, 'active'),
('USB-C Hub', 'Multi-port USB-C hub with HDMI, USB 3.0, and charging', 49.99, 'HUB-USBC-01', 75, 'active'),
('Mechanical Keyboard', 'Cherry MX Blue switches, RGB backlit', 159.99, 'KB-MECH-RGB', 40, 'active'),
('4K Monitor 27"', 'Ultra HD 4K monitor with USB-C connectivity', 399.99, 'MON-4K-27', 20, 'active'),
('Webcam HD', 'Full HD 1080p webcam with auto-focus', 79.99, 'CAM-HD-01', 60, 'active')
ON CONFLICT (sku) DO NOTHING;

INSERT INTO ecommerce.orders (customer_email, total_amount, status, shipping_address) VALUES
('customer1@example.com', 1379.98, 'completed', '123 Main St, City, State 12345'),
('customer2@example.com', 189.98, 'shipped', '456 Oak Ave, Town, State 67890'),
('customer3@example.com', 49.99, 'processing', '789 Pine Rd, Village, State 13579'),
('customer4@example.com', 559.98, 'completed', '321 Elm St, City, State 24680'),
('customer5@example.com', 79.99, 'pending', '654 Maple Dr, Town, State 97531')
ON CONFLICT DO NOTHING;

INSERT INTO ecommerce.order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
(1, 1, 1, 1299.99, 1299.99),
(1, 3, 1, 49.99, 49.99),
(1, 2, 1, 29.99, 29.99),
(2, 4, 1, 159.99, 159.99),
(2, 2, 1, 29.99, 29.99),
(3, 3, 1, 49.99, 49.99),
(4, 5, 1, 399.99, 399.99),
(4, 4, 1, 159.99, 159.99),
(5, 6, 1, 79.99, 79.99)
ON CONFLICT DO NOTHING;

-- Add some useful views for testing
CREATE OR REPLACE VIEW blog.published_posts AS
SELECT 
    id,
    title,
    content,
    author_id,
    published_at,
    created_at
FROM blog.posts 
WHERE status = 'published' 
ORDER BY published_at DESC;

CREATE OR REPLACE VIEW ecommerce.order_summary AS
SELECT 
    o.id,
    o.customer_email,
    o.total_amount,
    o.status,
    o.created_at,
    COUNT(oi.id) as item_count
FROM ecommerce.orders o
LEFT JOIN ecommerce.order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.customer_email, o.total_amount, o.status, o.created_at
ORDER BY o.created_at DESC;

-- Create some functions for testing
CREATE OR REPLACE FUNCTION blog.get_post_stats()
RETURNS TABLE(
    total_posts BIGINT,
    published_posts BIGINT,
    draft_posts BIGINT,
    total_comments BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM blog.posts),
        (SELECT COUNT(*) FROM blog.posts WHERE status = 'published'),
        (SELECT COUNT(*) FROM blog.posts WHERE status = 'draft'),
        (SELECT COUNT(*) FROM blog.comments);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ecommerce.get_product_stats()
RETURNS TABLE(
    total_products BIGINT,
    active_products BIGINT,
    out_of_stock BIGINT,
    total_orders BIGINT,
    revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM ecommerce.products),
        (SELECT COUNT(*) FROM ecommerce.products WHERE status = 'active'),
        (SELECT COUNT(*) FROM ecommerce.products WHERE stock_quantity = 0),
        (SELECT COUNT(*) FROM ecommerce.orders),
        (SELECT COALESCE(SUM(total_amount), 0) FROM ecommerce.orders WHERE status IN ('completed', 'shipped'));
END;
$$ LANGUAGE plpgsql;

-- Add table comments for better documentation
COMMENT ON COLUMN blog.posts.status IS 'Post publication status: draft, published, archived';
COMMENT ON COLUMN blog.comments.status IS 'Comment moderation status: pending, approved, rejected';
COMMENT ON COLUMN ecommerce.products.status IS 'Product availability status: active, inactive, discontinued';
COMMENT ON COLUMN ecommerce.orders.status IS 'Order processing status: pending, processing, shipped, completed, cancelled';

SELECT 'Sample database setup completed!' as message;