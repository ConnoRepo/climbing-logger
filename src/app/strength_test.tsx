import { StyleSheet, Text, View } from "react-native";

export default function StrengthTest() {
    return(
    <View style = {styles.container}> 
        <View style = {{ height: 500, width: 350, backgroundColor: "black"}}>
            <Text style = {{color: "white"}}>This is a max Strength Text</Text>
        </View>
        <View style = {{ height: 100, width: 300, backgroundColor: "black", alignItems: "center"}}>
            <Text style = {styles.text}>start</Text>
        </View>
    </View>
    )
}

function CountdownTimer(duration: number) {

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "red",
        gap: 12,
    },
    text: {
        color: "white",
        fontSize: 80,
    }
})
