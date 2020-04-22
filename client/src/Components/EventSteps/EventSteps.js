import React, { useState, useEffect, Fragment } from 'react';
import { useHistory } from 'react-router-dom';
import LinearProgress from '@material-ui/core/LinearProgress';
import Typography from '@material-ui/core/Typography';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';

import {
  getInterests,
  getEvent,
  postEvent,
  putEvent,
  postAttendant,
} from '../../logic/api';
import { buildValidationErrorsObject } from '../../logic/utils';
import { inputDateTime } from '../../logic/date-time';
import { uploadFile } from '../../logic/file-upload';

import { useUser } from '../UserProvider/UserProvider';

import Style from '../Style/Style';

import EventForm from '../EventForm/EventForm';
import InterestsSelect from '../InterestsSelect/InterestsSelect';
import EventCard from '../EventCard/EventCard';
import ErrorSnackbar from '../ErrorSnackbar/ErrorSnackbar';

const EventSteps = ({ match }) => {
  const history = useHistory();
  const user = useUser();
  const style = Style();

  const [activeStep, setActiveStep] = useState(0);
  const [skipped, setSkipped] = useState(new Set());
  const [event, setEvent] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [interests, setInterests] = useState(null);
  const [relatedInterests, setRelatedInterests] = useState([]);
  const [coverPhoto, setCoverPhoto] = useState('');
  const [updatedFields, setUpdatedFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [error, setError] = useState(null);

  const id = match.params.eventId;
  useEffect(() => {
    if (id) {
      setLoading(true);
      setError(null);
      if (user) {
        getEvent(id)
          .then((data) => {
            if (data.errors) {
              const error = data.errors[0];
              setError(`${error.param} ${error.msg}`);
              history.push('/events/new');
            } else {
              if (!(user._id === data.event.createdBy || user.admin)) {
                history.push(`/events/${id}`);
              } else {
                setEvent(data.event);
                setName(data.event.name);
                setDescription(data.event.description);
                setStartDate(inputDateTime(data.event.startDate));
                setEndDate(inputDateTime(data.event.endDate));
                setCreatedBy(data.event.createdBy);
                setCoverPhoto(data.event.coverPhoto);
              }
            }
          })
          .catch((error) => setError(error.message))
          .finally(() => setLoading(false));
      }
    } else {
      setName('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setCreatedBy('');
      setCoverPhoto('');
      setLoading(false);
    }
  }, [id, user, interests, history]);

  useEffect(() => {
    setLoading(true);
    getInterests()
      .then((data) => setInterests(data.interests))
      .catch((error) => setError(error))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    if (id && event && interests) {
      setRelatedInterests(
        interests.filter((interest) =>
          event.relatedInterests.some(
            (relatedInterest) => relatedInterest._id === interest._id
          )
        )
      );
    } else {
      setRelatedInterests([]);
    }
    setLoading(false);
  }, [id, event, interests]);

  const steps = ['Details', 'Interests', 'Preview'];

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <EventForm
            name={name}
            handleNameChange={handleNameChange}
            description={description}
            handleDescriptionChange={handleDescriptionChange}
            startDate={startDate}
            handleStartDateChange={handleStartDateChange}
            endDate={endDate}
            handleEndDateChange={handleEndDateChange}
            coverPhoto={coverPhoto}
            handleFileUpload={handleFileUpload}
            validationErrors={validationErrors}
          />
        );
      case 1:
        return (
          <InterestsSelect
            allInterests={interests}
            interests={relatedInterests}
            handleInterestsChange={handleRelatedInterestsChange}
            validationErrors={validationErrors}
          />
        );
      case 2:
        return (
          <EventCard
            event={{
              name,
              description,
              relatedInterests,
              coverPhoto,
            }}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  const isStepOptional = (step) => {
    return step === 1;
  };

  const isStepSkipped = (step) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      setError("A step that isn't optional can't be skipped.");
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const lastStep = activeStep === steps.length - 1;

  const handleNameChange = (name) => {
    setName(name);
    if (!updatedFields || !updatedFields.name) {
      setUpdatedFields({ ...updatedFields, name: true });
    }
  };

  const handleDescriptionChange = (description) => {
    setDescription(description);
    if (!updatedFields || !updatedFields.description) {
      setUpdatedFields({ ...updatedFields, description: true });
    }
  };

  const handleStartDateChange = (startDate) => {
    setStartDate(startDate);
    if (!updatedFields || !updatedFields.startDate) {
      setUpdatedFields({ ...updatedFields, startDate: true });
    }
  };

  const handleEndDateChange = (endDate) => {
    setEndDate(endDate);
    if (!updatedFields || !updatedFields.endDate) {
      setUpdatedFields({ ...updatedFields, endDate: true });
    }
  };

  const handleFileUpload = (file) => {
    if (file) {
      setLoading(true);
      uploadFile(file)
        .then((data) => {
          setCoverPhoto(data.uploadedFile.secure_url);
          if (!updatedFields || !updatedFields.coverPhoto) {
            setUpdatedFields({ ...updatedFields, coverPhoto: true });
          }
        })
        .catch((error) => setError(error))
        .finally(() => setLoading(false));
    }
  };

  const handleRelatedInterestsChange = (relatedInterests) => {
    setRelatedInterests(relatedInterests);
    if (!updatedFields || !updatedFields.relatedInterests) {
      setUpdatedFields({ ...updatedFields, relatedInterests: true });
    }
  };

  const handleNewClick = () => {
    setLoading(true);
    setError(null);
    setValidationErrors({});
    postEvent({
      name,
      description,
      startDate,
      endDate,
      createdBy: user._id,
      relatedInterests,
      coverPhoto,
    })
      .then((data) => {
        if (data.errors) {
          setError('The form contains errors');
          setValidationErrors(buildValidationErrorsObject(data.errors));
          setLoading(false);
        } else {
          postAttendant(data.event._id, {
            event: data.event._id,
            user: user._id,
          })
            .then((data) => history.push(`/events/${data.attendant.event}`))
            .catch((error) => {
              setError(error);
              setLoading(false);
            });
        }
      })
      .catch((error) => {
        setError(error);
        setLoading(false);
      });
  };

  const handleEditClick = () => {
    setLoading(true);
    setError(null);
    setValidationErrors({});
    putEvent(id, {
      name,
      description,
      startDate,
      endDate,
      createdBy,
      relatedInterests,
      coverPhoto,
    })
      .then((data) => {
        if (data.errors) {
          setError('The form contains errors');
          setValidationErrors(buildValidationErrorsObject(data.errors));
          setLoading(false);
        } else {
          history.push(`/events/${data.event._id}`);
        }
      })
      .catch((error) => {
        setError(error);
        setLoading(false);
      });
  };

  return (
    <Fragment>
      {loading && <LinearProgress />}
      <Typography className={style.center} variant="h2">
        {`${id ? 'Edit' : 'New'} event`}
      </Typography>
      <Stepper
        className={`${style.root} ${style.fullWidth}`}
        style={{ backgroundColor: 'inherit' }}
        activeStep={activeStep}
      >
        {steps.map((label, index) => {
          const stepProps = {};
          const labelProps = {};
          if (isStepOptional(index)) {
            labelProps.optional = (
              <Typography variant="caption">Optional</Typography>
            );
          }
          if (isStepSkipped(index)) {
            stepProps.completed = false;
          }
          return (
            <Step key={label} {...stepProps}>
              <StepLabel {...labelProps}>{label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>
      {activeStep !== steps.length && (
        <div className={style.root}>
          <Grid container direction="column" alignItems="center" spacing={2}>
            <Grid item>{getStepContent(activeStep)}</Grid>
            <Grid item>
              <Button
                className={style.buttons}
                variant="outlined"
                color="primary"
                onClick={() =>
                  id ? history.push(`/events/${id}`) : history.push('/')
                }
                disabled={loading}
              >
                Cancel
              </Button>
              {!!activeStep && (
                <Button
                  className={style.buttons}
                  variant="outlined"
                  color="primary"
                  onClick={() => handleBack()}
                >
                  Back
                </Button>
              )}
              {isStepOptional(activeStep) && (
                <Button
                  className={style.buttons}
                  variant="contained"
                  color="primary"
                  onClick={() => handleSkip()}
                >
                  Skip
                </Button>
              )}
              <Button
                className={style.buttons}
                variant="contained"
                color="primary"
                onClick={() => {
                  lastStep
                    ? id
                      ? handleEditClick()
                      : handleNewClick()
                    : handleNext();
                }}
                disabled={
                  lastStep &&
                  (!name ||
                    !description ||
                    !startDate ||
                    !endDate ||
                    loading ||
                    !updatedFields)
                }
              >
                {lastStep ? (id ? 'Edit' : 'Create') : 'Next'}
              </Button>
            </Grid>
          </Grid>
        </div>
      )}
      {error && <ErrorSnackbar error={error} />}
    </Fragment>
  );
};

export default EventSteps;
