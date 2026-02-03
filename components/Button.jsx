import { Pressable, StyleSheet, Text, View } from 'react-native';
import { hp } from '../constants';
import theme from '../constants/theme';
import Loading from './Loading';
const Button = ({
    buttonStyle,
    textStyle,
    title='',
    onPress=()=>{},
    loading=false,
    hasShadow=true,
}) => {

    const shadowStyle = {
        shadowColor: theme.colors.dark,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,

    }

    if(loading){
        return (
            <View style ={[styles.button, buttonStyle, {backgroundColor: 'white'}]}>
                <Loading/>
            </View>

        )}

  return (
    <Pressable onPress={onPress} style ={[styles.button, buttonStyle, hasShadow && shadowStyle]}>
      <Text style={[styles.text,textStyle]}>{title}</Text>
    </Pressable>
  )
}

export default Button

const styles = StyleSheet.create({
    button: {
        backgroundColor: 'rgba(46, 116, 202, 1)',
        height:hp(6.6),
        justifyContent: 'center',
        alignItems: 'center',
        borderCurve: 'continuous',
        borderRadius: theme.radius.xl,
    },

    text: {
    color: 'white',
    fontSize: hp(2.5),
    fontWeight: theme.fonts.bold,
  },

})