/*
# Wallet adjustment function

Adds a SECURITY DEFINER function `adjust_wallet_balance` that atomically:
- Updates a user's wallet_balance
- Inserts a wallet_transactions row
- Returns the new balance

This bypasses RLS so admin operations on wallets work reliably.
Only callable by admins (checked in function body).
*/

CREATE OR REPLACE FUNCTION public.adjust_wallet_balance(
  p_user_id uuid,
  p_amount numeric,
  p_type text,
  p_description text DEFAULT '',
  p_reference_id uuid DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance numeric(12,2);
  is_admin_check boolean;
BEGIN
  SELECT public.is_admin() INTO is_admin_check;
  IF NOT is_admin_check THEN
    RAISE EXCEPTION 'Permission denied: admin only';
  END IF;

  UPDATE public.profiles
  SET wallet_balance = wallet_balance + p_amount,
      updated_at = now()
  WHERE id = p_user_id
  RETURNING wallet_balance INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO public.wallet_transactions
    (user_id, type, amount, balance_after, reference_id, description, created_by)
  VALUES
    (p_user_id, p_type, p_amount, new_balance, p_reference_id, p_description, p_actor_id);

  RETURN new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_recharge(
  p_request_id uuid,
  p_final_amount numeric,
  p_admin_notes text DEFAULT '',
  p_actor_id uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_new_balance numeric(12,2);
  is_admin_check boolean;
BEGIN
  SELECT public.is_admin() INTO is_admin_check;
  IF NOT is_admin_check THEN
    RAISE EXCEPTION 'Permission denied: admin only';
  END IF;

  SELECT user_id INTO v_user_id FROM public.recharge_requests WHERE id = p_request_id AND status = 'pending';
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Recharge request not found or already processed';
  END IF;

  UPDATE public.recharge_requests
  SET status = 'approved',
      final_amount = p_final_amount,
      admin_notes = p_admin_notes,
      reviewed_by = p_actor_id,
      reviewed_at = now()
  WHERE id = p_request_id;

  SELECT public.adjust_wallet_balance(
    v_user_id,
    p_final_amount,
    'recharge',
    'Wallet recharge approved',
    p_request_id,
    p_actor_id
  ) INTO v_new_balance;

  RETURN v_new_balance;
END;
$$;
