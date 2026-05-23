/* eslint-disable @typescript-eslint/no-explicit-any */
import Select, { StylesConfig } from 'react-select';
import { OptionsOrGroups, GroupBase, ActionMeta } from 'react-select';

interface DropdownProps {
    options: OptionsOrGroups<any, GroupBase<any>>;
    value: any;
    onChange: (newValue: { label: unknown, value: any }, actionMeta: ActionMeta<unknown>) => void;
    className?: string;
    placeholder?: string;
    isDisabled?: boolean;
    isLoading?: boolean;
    isClearable?: boolean;
    isSearchable?: boolean;
}

const darkStyles: StylesConfig<any, false, GroupBase<any>> = {
    control: (base, state) => ({
        ...base,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        borderColor: state.isFocused ? '#818cf8' : 'rgba(71, 85, 105, 0.8)',
        boxShadow: state.isFocused ? '0 0 0 1px #818cf8' : 'none',
        color: '#e2e8f0',
        minHeight: 40,
        '&:hover': {
            borderColor: state.isFocused ? '#818cf8' : 'rgba(99, 102, 241, 0.6)',
        },
    }),
    singleValue: (base) => ({ ...base, color: '#e2e8f0' }),
    input: (base) => ({ ...base, color: '#e2e8f0' }),
    placeholder: (base) => ({ ...base, color: 'rgba(148, 163, 184, 0.7)' }),
    menu: (base) => ({
        ...base,
        backgroundColor: '#0f172a',
        border: '1px solid rgba(71, 85, 105, 0.8)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        zIndex: 50,
    }),
    menuList: (base) => ({ ...base, backgroundColor: '#0f172a' }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? 'rgba(99, 102, 241, 0.4)'
            : state.isFocused
                ? 'rgba(99, 102, 241, 0.2)'
                : 'transparent',
        color: state.isSelected ? '#fff' : '#e2e8f0',
        cursor: 'pointer',
        '&:active': {
            backgroundColor: 'rgba(99, 102, 241, 0.5)',
        },
    }),
    indicatorSeparator: (base) => ({ ...base, backgroundColor: 'rgba(71, 85, 105, 0.6)' }),
    dropdownIndicator: (base, state) => ({
        ...base,
        color: state.isFocused ? '#818cf8' : '#94a3b8',
        '&:hover': { color: '#cbd5e1' },
    }),
    clearIndicator: (base) => ({
        ...base,
        color: '#94a3b8',
        '&:hover': { color: '#f87171' },
    }),
    loadingIndicator: (base) => ({ ...base, color: '#94a3b8' }),
    noOptionsMessage: (base) => ({ ...base, color: '#94a3b8' }),
};

function Dropdown(props: DropdownProps) {
    return (
        <Select
            className={`w-full ${props.className || ''}`}
            classNamePrefix="react-select"
            value={props.value}
            onChange={props.onChange}
            options={props.options}
            placeholder={props.placeholder}
            isDisabled={props.isDisabled}
            isLoading={props.isLoading}
            isClearable={props.isClearable}
            isSearchable={props.isSearchable}
            styles={darkStyles}
            formatOptionLabel={(data: any) => {
                return <div className="flex flex-row items-center">
                    <span>{data.lable}</span>
                </div>;
            }}
        />
    );
}

Dropdown.displayName = 'Dropdown';

export default Dropdown;
