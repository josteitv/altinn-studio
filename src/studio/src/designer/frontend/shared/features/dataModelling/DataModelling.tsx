import React from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Button, ButtonVariant, Panel } from '@altinn/altinn-design-system';
import { SchemaEditorApp } from '@altinn/schema-editor/index';
import type { ILanguage } from '@altinn/schema-editor/types';
import {
  deleteDataModel,
  fetchDataModel,
  createDataModel,
  saveDataModel,
} from './sagas';
import { Create, Delete, SchemaSelect, XSDUpload } from './components';
import createDataModelMetadataOptions from './functions/createDataModelMetadataOptions';
import findPreferredMetadataOption from './functions/findPreferredMetadataOption';
import schemaPathIsSame from './functions/schemaPathIsSame';
import { DataModelsMetadataActions, LoadingState } from './sagas/metadata';
import type { IMetadataOption } from './functions/types';
import { LandingPagePanel } from './components/LandingPagePanel';
import { Dialog, makeStyles, createStyles } from '@material-ui/core';
import { getLanguageFromKey } from 'app-shared/utils/language';

interface IDataModellingContainerProps extends React.PropsWithChildren<any> {
  language: ILanguage;
  org: string;
  repo: string;
  createPathOption?: boolean;
}

type shouldSelectFirstEntryProps = {
  metadataOptions?: IMetadataOption[];
  selectedOption?: any;
  metadataLoadingState: LoadingState;
};

enum LandingDialogState {
  DatamodelsNotLoaded = 'DATAMODELS_NOT_LOADED',
  DialogIsVisible = 'DIALOG_IS_VISIBLE',
  DialogShouldNotBeShown = 'DIALOG_SHOULD_NOT_BE_SHOWN',
}

export const shouldSelectFirstEntry = ({
  metadataOptions,
  selectedOption,
  metadataLoadingState,
}: shouldSelectFirstEntryProps) => {
  return (
    metadataOptions?.length > 0 &&
    selectedOption === undefined &&
    metadataLoadingState === LoadingState.ModelsLoaded
  );
};

const useStyles = makeStyles(
  createStyles({
    button: {
      marginRight: 16,
    }
  }),
);

function DataModelling({
  language,
  org,
  repo,
  createPathOption,
}: IDataModellingContainerProps): JSX.Element {
  const classes = useStyles();
  const dispatch = useDispatch();
  const jsonSchema = useSelector((state: any) => state.dataModelling.schema);
  const metadataOptions = useSelector(
    createDataModelMetadataOptions,
    shallowEqual,
  );
  const metadataLoadingState = useSelector(
    (state: any) => state.dataModelsMetadataState.loadState,
  );
  const [selectedOption, setSelectedOption] = React.useState(undefined);
  const [createNewOpen, setCreateNewOpen] = React.useState(false);

  const uploadedOrCreatedFileName = React.useRef(null);
  const prevFetchedOption = React.useRef(null);

  const modelNames =
    metadataOptions?.map(({ label }: { label: string }) =>
      label.toLowerCase(),
    ) || [];

  React.useEffect(() => {
    if (metadataLoadingState === LoadingState.LoadingModels) {
      setSelectedOption(undefined);
    } else if (
      shouldSelectFirstEntry({
        metadataOptions,
        selectedOption,
        metadataLoadingState,
      })
    ) {
      setSelectedOption(metadataOptions[0]);
    } else {
      const option = findPreferredMetadataOption(
        metadataOptions,
        uploadedOrCreatedFileName.current,
      );
      if (option) {
        setSelectedOption(option);
        uploadedOrCreatedFileName.current = null;
      }
    }
  }, [metadataOptions, selectedOption, metadataLoadingState]);

  React.useEffect(() => {
    if (!schemaPathIsSame(prevFetchedOption?.current, selectedOption)) {
      dispatch(fetchDataModel({ metadata: selectedOption }));
      prevFetchedOption.current = selectedOption;
    }
  }, [selectedOption, dispatch]);

  const [landingDialogState, setLandingDialogState] =
    React.useState<LandingDialogState>(LandingDialogState.DatamodelsNotLoaded);

  const closeLandingPage = () => setLandingDialogState(LandingDialogState.DialogShouldNotBeShown);

  React.useEffect(
    () => {
      if (metadataLoadingState === LoadingState.ModelsLoaded) {
        if (jsonSchema && Object.keys(jsonSchema).length) {
          setLandingDialogState(LandingDialogState.DialogShouldNotBeShown);
        } else if (landingDialogState === LandingDialogState.DatamodelsNotLoaded) {
          setLandingDialogState(LandingDialogState.DialogIsVisible);
        }
      }
    },
    [jsonSchema, landingDialogState, metadataLoadingState]
  );

  const handleSaveSchema = (schema: any) => {
    dispatch(saveDataModel({ schema, metadata: selectedOption }));
  };

  const handleDeleteSchema = () => {
    dispatch(deleteDataModel({ metadata: selectedOption }));
  };

  const handleCreateSchema = (model: {
    name: string;
    relativeDirectory?: string;
  }) => {
    dispatch(createDataModel(model));
    uploadedOrCreatedFileName.current = model.name;
  };

  const handleXSDUploaded = (filename: string) => {
    const lowerCaseFileName = filename.toLowerCase();
    const filenameWithoutXsd = lowerCaseFileName.split('.xsd')[0];
    const schemaName = filename.substr(0, filenameWithoutXsd.length);

    uploadedOrCreatedFileName.current = schemaName;
    dispatch(DataModelsMetadataActions.getDataModelsMetadata());
  };

  const handleCreateNewFromLandingPage = () => {
    setCreateNewOpen(true);
  }

  const shouldDisplayLandingPage = landingDialogState === LandingDialogState.DialogIsVisible;
  const [hideIntroPage, setHideIntroPage] =React.useState(() => {
    const datamodelLocalStorage = (JSON.parse(localStorage.getItem('datamodelLocalStorage')) as any);
    if (datamodelLocalStorage) return datamodelLocalStorage.hideIntroPage;
    return false;
  }

  );
  const handleHideIntroPageButtonClick = () => {
    localStorage.setItem('datamodelLocalStorage', JSON.stringify({ hideIntroPage: true }));
    setHideIntroPage(true);
  }

  const t = (key: string) => getLanguageFromKey(key, language);

  return (
    <>
      <Dialog open={!hideIntroPage}>
        <Panel
          forceMobileLayout={true}
          title={t('schema_editor.info_dialog_title')}
        >
          <div>
            <p>{t('schema_editor.info_dialog_1')}</p>
            <p>{t('schema_editor.info_dialog_2')}</p>
            <p>{t('schema_editor.info_dialog_3')} <a href='https://docs.altinn.studio/app/development/data/data-model/'>{t('schema_editor.info_dialog_docs_link')}</a></p>
          </div>
          <span className={classes.button}><Button onClick={() => setHideIntroPage(true)}>Lukk</Button></span>
          <span className={classes.button}>
            <Button
              onClick={handleHideIntroPageButtonClick}
              variant={ButtonVariant.Secondary}
            >
              Ikke vis igjen
            </Button>
          </span>
        </Panel>
      </Dialog>
      <SchemaEditorApp
        language={language}
        schema={jsonSchema}
        onSaveSchema={handleSaveSchema}
        name={selectedOption?.label}
        loading={metadataLoadingState === LoadingState.LoadingModels}
        LandingPagePanel={shouldDisplayLandingPage && (
          <LandingPagePanel
            language={language}
            org={org}
            repo={repo}
            handleXSDUploaded={handleXSDUploaded}
            handleCreateModelClick={handleCreateNewFromLandingPage}
            closeLandingPage={closeLandingPage}
          />
        )}
      >
        <Create
          language={language}
          createAction={handleCreateSchema}
          dataModelNames={modelNames}
          createPathOption={createPathOption}
          disabled={shouldDisplayLandingPage}
          openByDefault={createNewOpen}
        />
        <XSDUpload
          language={language}
          onXSDUploaded={handleXSDUploaded}
          org={org}
          repo={repo}
          disabled={shouldDisplayLandingPage}
        />
        <SchemaSelect
          selectedOption={selectedOption}
          onChange={setSelectedOption}
          options={metadataOptions}
          disabled={shouldDisplayLandingPage}
        />
        <Delete
          schemaName={selectedOption?.value && selectedOption?.label}
          deleteAction={handleDeleteSchema}
          language={language}
        />
      </SchemaEditorApp>
    </>
  );
}
export default DataModelling;

DataModelling.defaultProps = {
  createPathOption: false,
};
