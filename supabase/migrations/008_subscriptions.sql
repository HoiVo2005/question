-- =============================================================================
-- Gói đăng ký & thanh toán cho giáo viên (VietQR + admin xác nhận thủ công).
-- =============================================================================

-- Gói hiện tại của mỗi giáo viên. Mỗi user chỉ có 1 dòng (gói đang áp dụng).
create table if not exists subscriptions (
  id          text primary key default gen_random_uuid()::text,
  user_id     text not null unique references users(id) on delete cascade,
  plan        text not null default 'free',     -- free | plus | pro | max
  cycle       text not null default 'monthly',  -- monthly | yearly
  status      text not null default 'active',   -- active | expired
  started_at  timestamptz default now(),
  expires_at  timestamptz,                      -- null = không hết hạn (vd: free)
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists idx_subscriptions_user on subscriptions(user_id);

-- Đơn thanh toán (chuyển khoản VietQR). Admin xác nhận khi nhận được tiền.
create table if not exists payment_orders (
  id            text primary key default gen_random_uuid()::text,
  user_id       text not null references users(id) on delete cascade,
  plan          text not null,                  -- plus | pro | max
  cycle         text not null,                  -- monthly | yearly
  amount        integer not null,               -- số tiền (VND)
  transfer_code text not null unique,           -- nội dung CK để đối soát, vd: EXG7K2Qop
  status        text not null default 'pending',-- pending | awaiting | paid | cancelled
  note          text,
  paid_at       timestamptz,
  confirmed_by  text references users(id) on delete set null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_payment_orders_user on payment_orders(user_id, created_at desc);
create index if not exists idx_payment_orders_status on payment_orders(status, created_at desc);

alter table subscriptions enable row level security;
alter table payment_orders enable row level security;
