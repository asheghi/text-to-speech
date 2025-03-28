import BackIcon from '@mui/icons-material/ArrowBack';
import { Link } from 'react-router-dom';
import "./Header.scss"
import React from 'react';

type HeaderProps = {
    headerTitle: string;
    backLink?: string;
    children?: React.ReactNode;
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
                <div className="ml-auto">
                    {props.children}
                </div>
            </div>
        </div>
    </>
}