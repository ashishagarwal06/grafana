// Libraries
import React, { ChangeEvent, FormEvent, useMemo } from 'react';
import { useAsync } from 'react-use';

// Components
import { Input, InlineFieldRow, InlineField, Select, TextArea } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { StreamingClientEditor, ManualEntryEditor, RandomWalkEditor } from './components';

// Types
import { TestDataDataSource } from './datasource';
import { TestDataQuery, Scenario } from './types';
import { PredictablePulseEditor } from './components/PredictablePulseEditor';
import { CSVWaveEditor } from './components/CSVWaveEditor';
import { defaultQuery } from './constants';

const showLabelsFor = ['random_walk', 'predictable_pulse', 'predictable_csv_wave'];
const endpoints = [
  { value: 'datasources', label: 'Data Sources' },
  { value: 'search', label: 'Search' },
  { value: 'annotations', label: 'Annotations' },
];

export interface EditorProps {
  onChange: any;
  query: TestDataQuery;
}

type Props = QueryEditorProps<TestDataDataSource, TestDataQuery>;

export const QueryEditor = ({ query, datasource, onChange, onRunQuery }: Props) => {
  const { loading, value: scenarioList } = useAsync<Scenario[]>(async () => {
    return datasource.getScenarios();
  }, []);

  query = { ...defaultQuery, ...query };

  const currentScenario = useMemo(() => scenarioList?.find(scenario => scenario.id === query.scenarioId), [
    scenarioList,
    query,
  ]);
  const scenarioId = currentScenario?.id;
  query.stringInput =
    scenarioId === 'grafana_api' ? 'datasources' : (query.stringInput || currentScenario?.stringInput) ?? '';

  const onScenarioChange = (item: SelectableValue<string>) => {
    onChange({
      ...query,
      stringInput: currentScenario?.stringInput ?? '',
      scenarioId: item.value!,
    });
    onRunQuery();
  };

  const onInputChange = (e: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement;
    onChange({ ...query, [name]: value });
    onRunQuery();
  };

  const onEndPointChange = ({ value }: SelectableValue) => {
    onChange({ ...query, stringInput: value });
  };

  const onStreamClientChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    if (name !== 'lines') {
      onChange({ ...query, stream: { ...query.stream, [name]: value } });
      onRunQuery();
    } else {
      onInputChange(e);
    }
  };

  const onPulseWaveChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({ ...query, pulseWave: { ...query.pulseWave, [name]: value } });
  };

  const onCSVWaveChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({ ...query, csvWave: { ...query.csvWave, [name]: value } });
  };

  const options = useMemo(() => (scenarioList || []).map(item => ({ label: item.name, value: item.id })), [
    scenarioList,
  ]);
  const showLabels = useMemo(() => showLabelsFor.includes(query.scenarioId), [query]);

  if (loading) {
    return null;
  }

  return (
    <>
      <InlineFieldRow>
        <InlineField labelWidth={14} label="Scenario">
          <Select
            options={options}
            value={options.find(item => item.value === query.scenarioId)}
            onChange={onScenarioChange}
            width={32}
          />
        </InlineField>
        {currentScenario?.stringInput && (
          <InlineField label="String Input">
            <Input
              id="stringInput"
              name="stringInput"
              placeholder={query.stringInput}
              value={query.stringInput}
              onChange={onInputChange}
            />
          </InlineField>
        )}
        <InlineField label="Alias" labelWidth={14}>
          <Input
            width={32}
            id="alias"
            type="text"
            placeholder="optional"
            pattern='[^<>&\\"]+'
            name="alias"
            value={query.alias}
            onChange={onInputChange}
          />
        </InlineField>
        {showLabels && (
          <InlineField
            label="Labels"
            labelWidth={14}
            tooltip={
              <>
                Set labels using a key=value syntax:
                <br />
                {`{ key = "value", key2 = "value" }`}
                <br />
                key="value", key2="value"
                <br />
                key=value, key2=value
                <br />
              </>
            }
          >
            <Input
              width={32}
              id="labels"
              name="labels"
              onChange={onInputChange}
              value={query?.labels}
              placeholder="key=value, key2=value2"
            />
          </InlineField>
        )}
      </InlineFieldRow>

      {scenarioId === 'manual_entry' && <ManualEntryEditor onChange={onChange} query={query} onRunQuery={onRunQuery} />}
      {scenarioId === 'random_walk' && <RandomWalkEditor onChange={onInputChange} query={query} />}
      {scenarioId === 'streaming_client' && <StreamingClientEditor onChange={onStreamClientChange} query={query} />}
      {scenarioId === 'grafana_api' && (
        <InlineField labelWidth={14} label="Endpoint">
          <Select
            options={endpoints}
            onChange={onEndPointChange}
            width={32}
            value={endpoints.find(ep => ep.value === query.stringInput)}
          />
        </InlineField>
      )}

      {scenarioId === 'arrow' && (
        <InlineField grow>
          <TextArea
            name="stringInput"
            value={query.stringInput}
            rows={10}
            placeholder="Copy base64 text data from query result"
            onChange={onInputChange}
          />
        </InlineField>
      )}

      {scenarioId === 'predictable_pulse' && <PredictablePulseEditor onChange={onPulseWaveChange} query={query} />}
      {scenarioId === 'predictable_csv_wave' && <CSVWaveEditor onChange={onCSVWaveChange} query={query} />}
    </>
  );
};
