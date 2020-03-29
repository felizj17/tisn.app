import React, {useState} from 'react';
import { useHistory } from 'react-router-dom';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';

const SignUpForm = () => {
  const history = useHistory();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signUpUrl = 'http://localhost:9000/api/users';

  const handleClick = () => {
    setLoading(true);
    fetch(signUpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user: {
          email,
          password
        }
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          history.push('/');
        }
      })
      .catch(error => console.log(error));

    setLoading(false);
  };

  return (
    <Box p={1}>
      <Grid container direction="column" alignItems="center" spacing={2}>
        <Grid item>
          <Typography variant="h1">
            Sign up
          </Typography>
        </Grid>
        <Grid item>
          <TextField
            label="Email"
            variant="outlined"
            value={email}
            onChange={event => setEmail(event.target.value)}
          />
        </Grid>
        <Grid item>
          <TextField
            type="password"
            label="Password"
            variant="outlined"
            value={password}
            onChange={event => setPassword(event.target.value)}
          />
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            onClick={() => handleClick()}
            disabled={loading || !email || !password}
          >
            Sign up
          </Button>
        </Grid>
        <Grid item>
          <Link href="/log-in">
            Log in
          </Link>
          {' | '}
          <Link href="/">
            Home
          </Link>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SignUpForm;
