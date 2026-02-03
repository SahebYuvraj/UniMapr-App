import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import ScreenWrapper from '../components/ScreenWrapper';
import { hp, wp } from '../constants';
import theme from '../constants/theme';

import { useRouter } from 'expo-router';

const Welcome = () => {

    const router = useRouter();

  return (
    <ScreenWrapper bg ="white">
        <StatusBar style="dark"/>
        <View style = {styles.container}>
        {/* welcome image */}
            <Image style ={styles.welcomeImage} resizeMode='contain'source={require('../assets/images/logo.png')}/>

        {/* title */}
        <View style={{gap:20}}>
            <Text style = {styles.title}>UNIMAPR</Text>
            <Text style = {styles.punchline}>Your campus companion</Text>
        </View>

       {/* footer */}
       <View style={styles.footer}>
        <Button
            title="Get Started"
            buttonStyle={{marginHorizontal:wp(3)}}
            onPress={()=> router.push('signUp')}
        />
        <View style={styles.bottomTextContainer}>
            <Text style = {styles.loginText}>Already have an account</Text>
            <Pressable onPress={()=>router.push('login')}>
                <Text style = {[styles.loginText, {color: theme.colors.primaryDark, fontWeight:theme.fonts.semibold }]}>Login</Text>
            </Pressable>

        </View>
       </View>

        </View>
    </ScreenWrapper>
  )
}

export default Welcome

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor : 'white',
        paddingHorizontal: wp(4),
    },

    welcomeImage: {
        width: wp(30),
        height: wp(100),
        alignSelf: 'center',

    },
    title:{
        color: '#000',
        fontSize: hp(4),
        textAlign: 'center',
        fontWeight: theme.fonts.bold,
    },
    punchline:{
        color: '#666',
        fontSize: hp(1.7),
        textAlign: 'center',
        paddingHorizontal: wp(10),
    },
    footer:{
        gap: 30,
        width: '100%',
    },
    bottomTextContainer:{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
    },
    loginText:{
        textAlign: 'center',
        fontSize: hp(1.6),
    },
})