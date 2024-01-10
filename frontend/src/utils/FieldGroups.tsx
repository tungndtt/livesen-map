import { ChangeEvent, useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SendIcon from "@mui/icons-material/Send";
import ClearIcon from "@mui/icons-material/Clear";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import deepCompare from "./deep-compare";
import dayjs from "dayjs";

type Field = {
  fieldId: string;
  label: string;
  type: "string" | "number" | "date";
};

export type FieldGroup = {
  groupId?: string;
  group: string;
  fields: Field[];
};

type SubmitProps = {
  submitTitle: string;
  submitDisabled: boolean;
  onSubmit: (data: any) => void;
  resetOnSubmit?: boolean;
};

type FieldGroupsProps = {
  fieldGroups: FieldGroup[];
  data: any;
  submitProps: SubmitProps;
};

type ChangeArgs = {
  groupId: string;
  index: number;
};

export default function FieldGroups({
  fieldGroups,
  data,
  submitProps: { submitTitle, submitDisabled, onSubmit, resetOnSubmit },
}: FieldGroupsProps) {
  const [options, setOptions] = useState<any>({});
  const [expandedOptions, setExpandedOptions] = useState<{
    [group: string]: boolean;
  }>({});

  useEffect(() => setOptions(structuredClone(data)), [data]);

  const onChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    args?: ChangeArgs
  ) => {
    const fieldId = e.target.name;
    const value = e.target.type === "number" ? +e.target.value : e.target.value;
    onChangeOption(fieldId, value, args);
  };

  const onChangeOption = (fieldId: string, value: any, args?: ChangeArgs) => {
    if (args) options[args.groupId][args.index][fieldId] = value;
    else options[fieldId] = value;
    setOptions({ ...options });
  };

  const reset = () => setOptions(structuredClone(data) ?? {});

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        pb: "10px",
      }}
    >
      {fieldGroups.map(({ groupId, group, fields }) => (
        <Accordion
          key={group}
          disableGutters
          sx={{
            boxShadow: "none",
            border: "2px solid #c7c7c7",
            borderRadius: "2px",
          }}
          expanded={expandedOptions?.[group] ?? false}
          onChange={() =>
            setExpandedOptions((prevExpandedOptions) => ({
              ...prevExpandedOptions,
              [group]: !prevExpandedOptions?.[group],
            }))
          }
        >
          <AccordionSummary
            sx={{ maxHeight: "fit-content" }}
            expandIcon={<ExpandMoreIcon />}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                maxHeight: "30px",
              }}
            >
              <Typography>
                <b>{group}</b>
              </Typography>
              {groupId && (
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedOptions((prevExpandedOptions) => ({
                      ...prevExpandedOptions,
                      [group]: true,
                    }));
                    if (!options?.[groupId]) options[groupId] = [];
                    const option = options?.[groupId];
                    option.push({});
                    setOptions({ ...options, [groupId]: option });
                  }}
                >
                  <AddCircleIcon />
                </IconButton>
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            {groupId
              ? (options?.[groupId] as any[])?.map((option, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    {fields.map(({ fieldId, label, type }) =>
                      type === "date" ? (
                        <DatePicker
                          slotProps={{
                            textField: { size: "small", fullWidth: true },
                          }}
                          key={fieldId}
                          label={label}
                          value={dayjs(option?.[fieldId] ?? null)}
                          onChange={(value) =>
                            onChangeOption(fieldId, value?.toDate(), {
                              groupId,
                              index,
                            })
                          }
                        />
                      ) : (
                        <TextField
                          key={fieldId}
                          fullWidth
                          size="small"
                          name={fieldId}
                          label={label}
                          type={type}
                          value={option?.[fieldId] ?? ""}
                          onWheel={(e) => e.currentTarget.blur()}
                          onChange={(e) => onChange(e, { groupId, index })}
                        />
                      )
                    )}
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      color="error"
                      endIcon={<DeleteIcon />}
                      onClick={() => {
                        const option = options?.[groupId];
                        option.splice(index, 1);
                        setOptions({ ...options, [groupId]: option });
                      }}
                    >
                      Delete
                    </Button>
                  </Box>
                ))
              : fields.map(({ fieldId, label, type }) =>
                  type === "date" ? (
                    <DatePicker
                      slotProps={{
                        textField: { size: "small", fullWidth: true },
                      }}
                      label={label}
                      key={fieldId}
                      value={dayjs(options?.[fieldId] ?? null)}
                      onChange={(value) =>
                        onChangeOption(fieldId, value?.toDate())
                      }
                    />
                  ) : (
                    <TextField
                      key={fieldId}
                      fullWidth
                      size="small"
                      name={fieldId}
                      label={label}
                      type={type}
                      value={options?.[fieldId] ?? ""}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={onChange}
                    />
                  )
                )}
          </AccordionDetails>
        </Accordion>
      ))}
      <Box className="button-row-container">
        <Button
          fullWidth
          size="small"
          variant="outlined"
          color="warning"
          endIcon={<SendIcon />}
          disabled={submitDisabled}
          onClick={() => {
            onSubmit(options);
            if (resetOnSubmit) reset();
          }}
        >
          {submitTitle}
        </Button>
        <Button
          sx={{ width: "40%" }}
          size="small"
          variant="outlined"
          color="secondary"
          endIcon={<ClearIcon />}
          onClick={reset}
        >
          Reset
        </Button>
      </Box>
    </Box>
  );
}
