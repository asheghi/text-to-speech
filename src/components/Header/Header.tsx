import BackIcon from '@mui/icons-material/ArrowBack';
import { Link } from 'react-router-dom';
import "./Header.scss"

type HeaderProps = {
    headerTitle: string;
    backLink?: string;
}

export const Header = (props: HeaderProps) => {
    return <>
        <div className="header-placeholder"></div>
        <div className='header'>
            <div className='header-content'>
                {props.backLink &&
                    <Link className='back-link' to={props.backLink}>
                        <BackIcon className='back-icon' />
                    </Link>
                }
                <h1>{props.headerTitle}</h1>
            </div>
        </div>
    </>
}