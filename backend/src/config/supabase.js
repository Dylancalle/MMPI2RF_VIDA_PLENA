const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // Asegúrate de instalar dotenv: npm install dotenv

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xnhtjbmpsynzqdnohzkf.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_Lwu9YdOsFbONmRHZcIUzMg_2KjjOvQR';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;