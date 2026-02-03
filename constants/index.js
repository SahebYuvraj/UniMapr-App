import { Dimensions } from 'react-native';


const {width: deviceWidth, height: deviceHeight} = Dimensions.get('window');

const hp = percentage => (deviceHeight * percentage) / 100;
const wp = percentage => (deviceWidth * percentage) / 100;

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.");
}

export { hp, wp };

export const stripHtml = (html) => {
    return html.replace(/<[^>]+>/gm, '');
    }
