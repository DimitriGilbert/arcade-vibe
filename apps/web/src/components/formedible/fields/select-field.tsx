import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from '@/lib/formedible/types';
import { FieldWrapper } from './base-field-wrapper';

interface SelectFieldSpecificProps extends BaseFieldProps {
  options: Array<{ value: string; label: string }> | string[];
}

export const SelectField: React.FC<SelectFieldSpecificProps> = ({
  fieldApi,
  label,
  description,
  placeholder,
  inputClassName,
  labelClassName,
  wrapperClassName,
  options = [],
}) => {
  const name = fieldApi.name;
  const value = (fieldApi.state?.value as string) || '';
  const isDisabled = fieldApi.form?.state?.isSubmitting ?? false;
  const hasErrors = fieldApi.state?.meta?.isTouched && fieldApi.state?.meta?.errors?.length > 0;

  const onValueChange = (value: string | null) => {
    fieldApi.handleChange(value);
  };

  const onBlur = () => {
    fieldApi.handleBlur();
  };

  const computedInputClassName = cn(
    inputClassName,
    hasErrors ? "border-destructive" : ""
  );

  const selectedOption = options.find((o) => {
    const oValue = typeof o === 'string' ? o : o.value;
    return oValue === value;
  });
  const selectedLabel = selectedOption
    ? (typeof selectedOption === 'string' ? selectedOption : selectedOption.label)
    : null;

  return (
    <FieldWrapper
      fieldApi={fieldApi}
      label={label}
      description={description}
      inputClassName={inputClassName}
      labelClassName={labelClassName}
      wrapperClassName={wrapperClassName}
    >
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={isDisabled}
      >
        <SelectTrigger
          id={name + "-trigger"}
          onBlur={onBlur}
          className={computedInputClassName}
        >
          <SelectValue placeholder={placeholder || "Select an option"}>
            {selectedLabel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => {
            const optVal = typeof option === 'string' ? option : option.value;
            const optLbl = typeof option === 'string' ? option : option.label;
            return (
              <SelectItem key={optVal} value={optVal}>
                {optLbl}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </FieldWrapper>
  );
};
