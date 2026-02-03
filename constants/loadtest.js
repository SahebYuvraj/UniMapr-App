import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  vus: 50,          // number of virtual users
  duration: '30s',  // test duration
};

export default function () {
  const url = 'https://gduurwiqtxeuyqhgtoqj.supabase.co/rest/v1/users?select=*';
  
  const headers = {
    apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
,
    Authorization: 'Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}'
,
  };

  const res = http.get(url, { headers });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // wait 1 second between user actions
}
