-- Video posts tracking table
CREATE TABLE IF NOT EXISTS video_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'youtube', 'tiktok'
  title VARCHAR(255),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, posted, failed
  external_post_id VARCHAR(255), -- YouTube videoId, TikTok video_id
  posted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_video_posts_status ON video_posts(status);
CREATE INDEX idx_video_posts_platform ON video_posts(platform);
CREATE INDEX idx_video_posts_posted_at ON video_posts(posted_at);

-- YouTube tokens table
CREATE TABLE IF NOT EXISTS youtube_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id VARCHAR(255) NOT NULL UNIQUE,
  channel_name VARCHAR(255),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_youtube_accounts_channel_id ON youtube_accounts(channel_id);

-- TikTok accounts table
CREATE TABLE IF NOT EXISTS tiktok_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tiktok_accounts_user_id ON tiktok_accounts(user_id);
