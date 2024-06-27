import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://lcaximxcszcvxwhdjgvg.supabase.co'
const supabaseKey ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjYXhpbXhjc3pjdnh3aGRqZ3ZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzU2MzE0MiwiZXhwIjoyMDMzMTM5MTQyfQ.o3A5mo8gVXvip0MIdZnBLREK0_WIYUm758qBPZX_l08'

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
export default supabaseAdmin;