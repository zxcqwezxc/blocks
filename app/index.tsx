import { Text, View } from "react-native";
import Game from "@/components/Game";

export default function Index() {
  return (
    <>
    {/*<View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >*/}
      <Game />
      {/*<Text>Edit app/index.tsx to edit this screen.</Text>
    </View>*/}
    </>
  );
}
