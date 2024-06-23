import { Outlet, useNavigation } from "react-router-dom";

export const RootLayout = (): JSX.Element => {
    const navigation = useNavigation();

    console.log({ navigation });

    return <>
        <div className="header text-3xl font-bold pt-2 pb-6 text-blue-600 container mx-auto">
            Text to Speech
        </div>
        <Outlet />
    </>
}