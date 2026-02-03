import { Stack, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getUserData } from '../services/userService'

const _layout = () => {
  return (
    <AuthProvider>
      <MainLayout/>
    </AuthProvider>
  )

}

const MainLayout = () => {
    const {setAuth, setUserData} = useAuth();
    const router = useRouter();

    useEffect(() => {
        supabase.auth.onAuthStateChange((_event, session) => {
          //console.log('session user:',session?.user);

          if(session) {
            setAuth(session?.user);
            updateUserData(session?.user);
            router.replace('/home');
            
          }
          else {
            setAuth(session?.user);
            router.replace('/welcome');
           

          }

          
      })
    },[])
  
    
    const updateUserData = async (user) => {
      let res = await getUserData(user?.id);
      if(res.success) setUserData(res.data);
    }

   

  return (
    <Stack
        screenOptions={{
            headerShown: false
        }}
    >  
    
        <Stack.Screen
          name= "postDetails"
          options={{ 
            presentation: 'modal'
          }} 
      />
    </Stack>
        
  )
}

export default _layout