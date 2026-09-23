import { StyleSheet, Text, View } from "react-native";

export default function Rankings() {
    return(
    <View style = {styles.container}> 
        <Text> This is the History Screen </Text>
    </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
})
