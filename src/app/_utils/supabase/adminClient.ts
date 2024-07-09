import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://ewmizuhvajrsoylkaoaq.supabase.co'
const supabaseKey ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bWl6dWh2YWpyc295bGthb2FxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTg5MDMxMiwiZXhwIjoyMDM1NDY2MzEyfQ.ahDctdlN43CRrv3pppvoqtBGMAoPk1s9xIA4bDKW9Fo'

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
export default supabaseAdmin;