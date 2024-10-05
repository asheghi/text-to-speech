import { Box, LinearProgress, Typography } from "@mui/joy"

export const ProgressBar = (props: {
    header: string,
    label: string,
    value: number,
    max: number
}) => {
    const percent = Math.round(props.value / props.max * 100);
    return <Box pb={2} >
    <Typography>
        {props.header}
    </Typography>
    <LinearProgress
        determinate
        variant="outlined"
        color={getColorForPercentage(percent)}
        size="sm"
        thickness={32}
        value={percent}
        sx={{
            '--LinearProgress-radius': '0px',
            '--LinearProgress-progressThickness': '24px',
            boxShadow: 'sm',
            borderColor: 'neutral.500',
        }}
    >
        <Typography
            level="body-xs"
            textColor="common.white"
            sx={{ fontWeight: 'xl', mixBlendMode: 'difference' }}
        >
            {props.label} {`${percent}%`}
        </Typography>
    </LinearProgress>
</Box>
}



const getColorForPercentage = (percentage: number): 'primary' | 'neutral' | 'danger' | 'success' | 'warning' => {
    if (percentage < 0 || percentage > 100) {
      return 'neutral'; // Return neutral for invalid percentages
    }
  
    if (percentage < 20) {
      return 'danger';
    } else if (percentage < 40) {
      return 'warning';
    } else if (percentage < 60) {
      return 'neutral';
    } else if (percentage < 80) {
      return 'primary';
    } else {
      return 'success';
    }
  };