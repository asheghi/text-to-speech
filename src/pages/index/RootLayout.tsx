import { Outlet, useNavigation } from "react-router-dom";

export const RootLayout = (): JSX.Element => {
    const navigation = useNavigation();

    console.log({ navigation });

    return <>
        <div className="header">
            LingoPal Words!
        </div>
        <Outlet />
    </>
}