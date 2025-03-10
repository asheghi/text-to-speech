import { useState } from "react";

const prefix = "_use_"
export function useLocalStorageState<K>(key: string, defaultValue: K) : [value: K, setter: (v: K) => void] {
    const [value, setValue] = useState<K>(() => {
        const v = localStorage.getItem(prefix + key);
        if (v) {
            try {
                return JSON.parse(v) as K;
            } catch (error) {
                // ignore
            }
        }
        return defaultValue;
    });


    const handleSet = (newValue: K) => {
        localStorage.setItem(prefix + key, JSON.stringify(newValue));
        setValue(newValue);
    }

    return [value, handleSet];
}