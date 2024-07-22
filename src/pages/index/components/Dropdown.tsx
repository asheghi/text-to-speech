/* eslint-disable @typescript-eslint/no-explicit-any */
import Select from 'react-select';
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