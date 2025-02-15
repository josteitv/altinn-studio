import React, { ChangeEvent } from 'react';
import { makeStyles, TextField } from '@material-ui/core';
import { useSelector } from 'react-redux';
import { Autocomplete } from '@material-ui/lab';
import type { ISchemaState } from '../../types';
import { getDomFriendlyID } from '../../utils/schema';

export interface IRefSelectProps {
  id: string;
  value: string;
  readOnly?: boolean;
  fullWidth?: boolean;
  onChange: (id: string, value: string) => void;
}

export const RefSelect = ({ id, onChange, value, fullWidth, readOnly }: IRefSelectProps) => {
  const classes = makeStyles({
    root: {
      background: 'white',
      color: 'black',
      border: '1px solid #006BD8',
      boxSsizing: 'border-box',
      padding: 4,
      marginTop: 4,
      '&.Mui-disabled': {
        background: '#f4f4f4',
        color: 'black',
        border: '1px solid #6A6A6A',
        boxSizing: 'border-box',
      },
    },
  })();

  const definitions: string[] = useSelector((state: ISchemaState) =>
    state.uiSchema.filter((s) => s.path.includes('#/definitions')).map((d) => d.path.replace('#/definitions/', '')),
  );

  const onChangeValue = (event: ChangeEvent<unknown>, val: unknown) => {
    if (!val) {
      return;
    }
    onChange(id, `#/definitions/${val as string}`);
  };

  return (
    <Autocomplete
      freeSolo={false}
      fullWidth={fullWidth}
      id={`${getDomFriendlyID(id)}-ref-select`}
      disabled={readOnly}
      value={value?.replace('#/definitions/', '')}
      onChange={onChangeValue}
      className={classes.root}
      disableClearable={true}
      options={definitions}
      renderInput={(params) => {
        (params.InputProps as any).disableUnderline = true;
        return <TextField {...params} />;
      }}
    />
  );
};
