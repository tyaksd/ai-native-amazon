-- User behavior logging tables
-- This migration creates tables for comprehensive user behavior tracking

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  screen_resolution VARCHAR(20),
  language VARCHAR(10),
  timezone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Page views table
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  page_url TEXT NOT NULL,
  page_title TEXT,
  page_path TEXT NOT NULL,
  referrer TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,
  scroll_depth DECIMAL(5,2) DEFAULT 0,
  time_on_page INTEGER DEFAULT 0, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- User interactions table
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  interaction_type VARCHAR(50) NOT NULL, -- click, hover, scroll, focus, blur
  element_type VARCHAR(50), -- button, link, image, input, etc.
  element_id VARCHAR(255),
  element_class VARCHAR(255),
  element_text TEXT,
  element_href TEXT,
  page_url TEXT NOT NULL,
  x_position INTEGER,
  y_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Search behavior table
CREATE TABLE IF NOT EXISTS search_behavior (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  search_query TEXT NOT NULL,
  search_type VARCHAR(50), -- product, brand, general
  filters_applied JSONB,
  results_count INTEGER DEFAULT 0,
  clicked_result_id VARCHAR(255),
  clicked_result_type VARCHAR(50), -- product, brand
  search_duration INTEGER, -- time from search to click in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Product interactions table
CREATE TABLE IF NOT EXISTS product_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  brand_id VARCHAR(255),
  interaction_type VARCHAR(50) NOT NULL, -- view, click, favorite, add_to_cart, purchase
  product_name TEXT,
  product_price DECIMAL(10,2),
  product_category VARCHAR(100),
  product_type VARCHAR(100),
  position_in_list INTEGER, -- position in product grid
  time_on_product INTEGER, -- time spent viewing product in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Navigation behavior table
CREATE TABLE IF NOT EXISTS navigation_behavior (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  from_page TEXT,
  to_page TEXT,
  navigation_type VARCHAR(50), -- direct, back, forward, link_click, form_submit
  navigation_method VARCHAR(50), -- click, keyboard, programmatic
  time_between_pages INTEGER, -- time between page loads in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Error tracking table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  error_type VARCHAR(50) NOT NULL, -- javascript, api, network, validation
  error_message TEXT NOT NULL,
  error_stack TEXT,
  page_url TEXT NOT NULL,
  user_agent TEXT,
  browser_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  page_url TEXT NOT NULL,
  load_time INTEGER, -- page load time in milliseconds
  dom_content_loaded INTEGER,
  first_contentful_paint INTEGER,
  largest_contentful_paint INTEGER,
  first_input_delay INTEGER,
  cumulative_layout_shift DECIMAL(5,3),
  network_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);

CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);

CREATE INDEX IF NOT EXISTS idx_user_interactions_session_id ON user_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at);

CREATE INDEX IF NOT EXISTS idx_search_behavior_session_id ON search_behavior(session_id);
CREATE INDEX IF NOT EXISTS idx_search_behavior_query ON search_behavior(search_query);
CREATE INDEX IF NOT EXISTS idx_search_behavior_created_at ON search_behavior(created_at);

CREATE INDEX IF NOT EXISTS idx_product_interactions_session_id ON product_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_product_interactions_product_id ON product_interactions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_interactions_type ON product_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_product_interactions_created_at ON product_interactions(created_at);

CREATE INDEX IF NOT EXISTS idx_navigation_behavior_session_id ON navigation_behavior(session_id);
CREATE INDEX IF NOT EXISTS idx_navigation_behavior_created_at ON navigation_behavior(created_at);

CREATE INDEX IF NOT EXISTS idx_error_logs_session_id ON error_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_session_id ON performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_sessions table
CREATE TRIGGER update_user_sessions_updated_at 
    BEFORE UPDATE ON user_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to clean up old sessions (DISABLED - data retention for analysis)
-- Note: This function is created but not scheduled to run automatically
-- Uncomment and modify the interval if you want to enable data cleanup in the future
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
    -- Data retention disabled for long-term analysis
    -- DELETE FROM user_sessions 
    -- WHERE created_at < NOW() - INTERVAL '365 days'; -- 1 year retention if needed
    RAISE NOTICE 'Data cleanup function exists but is disabled for long-term data retention';
END;
$$ language 'plpgsql';

-- Create a function to get session statistics
CREATE OR REPLACE FUNCTION get_session_stats(session_id_param VARCHAR(255))
RETURNS TABLE (
    total_page_views BIGINT,
    total_interactions BIGINT,
    total_search_queries BIGINT,
    total_product_views BIGINT,
    session_duration INTERVAL,
    pages_visited TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM page_views WHERE session_id = session_id_param) as total_page_views,
        (SELECT COUNT(*) FROM user_interactions WHERE session_id = session_id_param) as total_interactions,
        (SELECT COUNT(*) FROM search_behavior WHERE session_id = session_id_param) as total_search_queries,
        (SELECT COUNT(*) FROM product_interactions WHERE session_id = session_id_param AND interaction_type = 'view') as total_product_views,
        (SELECT MAX(created_at) - MIN(created_at) FROM page_views WHERE session_id = session_id_param) as session_duration,
        (SELECT ARRAY_AGG(DISTINCT page_path) FROM page_views WHERE session_id = session_id_param) as pages_visited;
END;
$$ language 'plpgsql';

-- Create a function for long-term data analysis
CREATE OR REPLACE FUNCTION get_analytics_summary(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_sessions BIGINT,
    total_page_views BIGINT,
    total_interactions BIGINT,
    total_searches BIGINT,
    total_product_clicks BIGINT,
    avg_session_duration INTERVAL,
    most_clicked_products TEXT[],
    most_searched_terms TEXT[],
    top_pages TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(DISTINCT session_id) FROM user_sessions 
         WHERE created_at BETWEEN start_date AND end_date) as total_sessions,
        (SELECT COUNT(*) FROM page_views 
         WHERE created_at BETWEEN start_date AND end_date) as total_page_views,
        (SELECT COUNT(*) FROM user_interactions 
         WHERE created_at BETWEEN start_date AND end_date) as total_interactions,
        (SELECT COUNT(*) FROM search_behavior 
         WHERE created_at BETWEEN start_date AND end_date) as total_searches,
        (SELECT COUNT(*) FROM product_interactions 
         WHERE interaction_type = 'click' AND created_at BETWEEN start_date AND end_date) as total_product_clicks,
        (SELECT AVG(EXTRACT(EPOCH FROM (MAX(pv.created_at) - MIN(pv.created_at))))::INTERVAL 
         FROM page_views pv 
         WHERE pv.created_at BETWEEN start_date AND end_date
         GROUP BY pv.session_id) as avg_session_duration,
        (SELECT ARRAY_AGG(product_name ORDER BY click_count DESC)
         FROM (
             SELECT product_name, COUNT(*) as click_count
             FROM product_interactions 
             WHERE interaction_type = 'click' AND created_at BETWEEN start_date AND end_date
             GROUP BY product_name
             ORDER BY click_count DESC
             LIMIT 10
         ) top_products) as most_clicked_products,
        (SELECT ARRAY_AGG(search_query ORDER BY search_count DESC)
         FROM (
             SELECT search_query, COUNT(*) as search_count
             FROM search_behavior 
             WHERE created_at BETWEEN start_date AND end_date
             GROUP BY search_query
             ORDER BY search_count DESC
             LIMIT 10
         ) top_searches) as most_searched_terms,
        (SELECT ARRAY_AGG(page_path ORDER BY view_count DESC)
         FROM (
             SELECT page_path, COUNT(*) as view_count
             FROM page_views 
             WHERE created_at BETWEEN start_date AND end_date
             GROUP BY page_path
             ORDER BY view_count DESC
             LIMIT 10
         ) top_pages) as top_pages;
END;
$$ language 'plpgsql';

-- Create a function to get user journey analysis
CREATE OR REPLACE FUNCTION get_user_journey_analysis(session_id_param VARCHAR(255))
RETURNS TABLE (
    step_number BIGINT,
    page_path TEXT,
    page_title TEXT,
    time_on_page INTEGER,
    scroll_depth DECIMAL(5,2),
    interactions_count BIGINT,
    event_timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY pv.created_at) as step_number,
        pv.page_path,
        pv.page_title,
        pv.time_on_page,
        pv.scroll_depth,
        (SELECT COUNT(*) FROM user_interactions ui 
         WHERE ui.session_id = pv.session_id 
         AND ui.created_at BETWEEN pv.created_at AND pv.created_at + INTERVAL '1 minute') as interactions_count,
        pv.created_at as event_timestamp
    FROM page_views pv
    WHERE pv.session_id = session_id_param
    ORDER BY pv.created_at;
END;
$$ language 'plpgsql';

-- Create a function to get product performance analysis
CREATE OR REPLACE FUNCTION get_product_performance_analysis(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    product_id VARCHAR(255),
    product_name TEXT,
    product_category VARCHAR(100),
    total_views BIGINT,
    total_clicks BIGINT,
    total_favorites BIGINT,
    click_through_rate DECIMAL(5,2),
    avg_time_on_product INTEGER,
    conversion_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pi.product_id,
        pi.product_name,
        pi.product_category,
        (SELECT COUNT(*) FROM product_interactions pi2 
         WHERE pi2.product_id = pi.product_id 
         AND pi2.interaction_type = 'view'
         AND pi2.created_at BETWEEN start_date AND end_date) as total_views,
        (SELECT COUNT(*) FROM product_interactions pi2 
         WHERE pi2.product_id = pi.product_id 
         AND pi2.interaction_type = 'click'
         AND pi2.created_at BETWEEN start_date AND end_date) as total_clicks,
        (SELECT COUNT(*) FROM product_interactions pi2 
         WHERE pi2.product_id = pi.product_id 
         AND pi2.interaction_type = 'favorite'
         AND pi2.created_at BETWEEN start_date AND end_date) as total_favorites,
        CASE 
            WHEN (SELECT COUNT(*) FROM product_interactions pi2 
                  WHERE pi2.product_id = pi.product_id 
                  AND pi2.interaction_type = 'view'
                  AND pi2.created_at BETWEEN start_date AND end_date) > 0
            THEN ROUND(
                (SELECT COUNT(*) FROM product_interactions pi2 
                 WHERE pi2.product_id = pi.product_id 
                 AND pi2.interaction_type = 'click'
                 AND pi2.created_at BETWEEN start_date AND end_date)::DECIMAL / 
                (SELECT COUNT(*) FROM product_interactions pi2 
                 WHERE pi2.product_id = pi.product_id 
                 AND pi2.interaction_type = 'view'
                 AND pi2.created_at BETWEEN start_date AND end_date)::DECIMAL * 100, 2
            )
            ELSE 0
        END as click_through_rate,
        (SELECT AVG(pi2.time_on_product) FROM product_interactions pi2 
         WHERE pi2.product_id = pi.product_id 
         AND pi2.time_on_product IS NOT NULL
         AND pi2.created_at BETWEEN start_date AND end_date)::INTEGER as avg_time_on_product,
        CASE 
            WHEN (SELECT COUNT(*) FROM product_interactions pi2 
                  WHERE pi2.product_id = pi.product_id 
                  AND pi2.interaction_type = 'view'
                  AND pi2.created_at BETWEEN start_date AND end_date) > 0
            THEN ROUND(
                (SELECT COUNT(*) FROM product_interactions pi2 
                 WHERE pi2.product_id = pi.product_id 
                 AND pi2.interaction_type = 'purchase'
                 AND pi2.created_at BETWEEN start_date AND end_date)::DECIMAL / 
                (SELECT COUNT(*) FROM product_interactions pi2 
                 WHERE pi2.product_id = pi.product_id 
                 AND pi2.interaction_type = 'view'
                 AND pi2.created_at BETWEEN start_date AND end_date)::DECIMAL * 100, 2
            )
            ELSE 0
        END as conversion_rate
    FROM product_interactions pi
    WHERE pi.created_at BETWEEN start_date AND end_date
    GROUP BY pi.product_id, pi.product_name, pi.product_category
    ORDER BY total_views DESC;
END;
$$ language 'plpgsql';

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (for API endpoints)
CREATE POLICY "Service role can manage all analytics data" ON user_sessions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all analytics data" ON page_views
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all analytics data" ON user_interactions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all analytics data" ON search_behavior
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all analytics data" ON product_interactions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all analytics data" ON navigation_behavior
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all analytics data" ON error_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all analytics data" ON performance_metrics
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for authenticated users to read analytics data (for dashboard access)
CREATE POLICY "Authenticated users can read analytics data" ON user_sessions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read analytics data" ON page_views
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read analytics data" ON user_interactions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read analytics data" ON search_behavior
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read analytics data" ON product_interactions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read analytics data" ON navigation_behavior
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read analytics data" ON error_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read analytics data" ON performance_metrics
    FOR SELECT USING (auth.role() = 'authenticated');
