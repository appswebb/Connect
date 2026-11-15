import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://trrakyybnvxpdhxwgjrz.supabase.co";
const supabasePublishableKey = "sb_publishable_OJ4wBPPNVBBcrcNl12yonw_hRSlMKsZ";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
