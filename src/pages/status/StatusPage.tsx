import { trpc } from "@/api";
import { Page } from "@/components/Page";
import { Box, Divider, Typography } from "@mui/joy";
import { ProgressBar } from "./ProgressBar";
import { readableFileSize } from "./utils/readableFileSize";

const StatusPage = () => {
    const { data: storage, isLoading: isFetchingStorage, error: storageFetchFailed } = trpc.tts.getStorageStatus.useQuery();


    if (storageFetchFailed) {
        return <div>Failed to fetch data ...</div>
    }

    if (isFetchingStorage) {
        return <div>Loading ...</div>
    }

    console.log(storage)

    if (storage) {

        return <Page headerTitle="Status" backLink="/">
            <Box className="container flex flex-col gap-2" paddingX={2}>
                <Typography>
                    Audio Cache Usage: {readableFileSize(storage.used_audio)}
                </Typography>
                <Typography>
                    Models Usage: {readableFileSize(storage.used_models)}
                </Typography>
                <Divider className="my-4" />
                <ProgressBar header={"Audios Disk"} label={`Used:`} value={storage.disk_audio.used} max={storage.disk_audio.total} />
                <ProgressBar header={"Models Disk"} label={"Used: "} value={storage.disk_models.used} max={storage.disk_models.total} />
            </Box>
        </Page>
    }
}

export default StatusPage;