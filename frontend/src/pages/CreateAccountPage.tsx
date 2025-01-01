import {
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
  useTheme,
  styled,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { Fragment, useRef, useState } from "react";
import { VerificationCodeInput } from "../shared/components/VerificationCode/VerificationCode";
import { copyTextToClipboard } from "../shared/utils/clipboard";
import CopyIcon from "../assets/icons/copy.svg";
import CloseIcon from "@mui/icons-material/Close";
import { green, red } from "@mui/material/colors";
import { userService } from "../modules/user/services";
import { accountService } from "../modules/account/services";
import { NettuProgress } from "../shared/components/NettuProgress";
import { apiConfig } from "../config/api";

// Component Props Interfaces
interface Props { }

interface SnackbarState {
  open: boolean;
  success: boolean;
  message: string;
}

interface Values {
  email: string;
  code: string;
}

interface Account {
  name: string;
  secretKey: string;
}

// Styled Components
const PaperWrapper = styled(Paper)(({ theme }) => ({
  padding: "24px 20px",
  borderTop: `4px solid ${theme.palette.primary.main}`,
  width: "490px",
  boxSizing: "border-box",
  maxWidth: "95%",
}));

const LoadingDialog = styled(Paper)(({ theme }) => ({
  width: "490px",
  height: "500px",
  maxWidth: "95%",
}));

const ErrorText = styled(Typography)<{ component?: React.ElementType }>(({ theme }) => ({
  fontWeight: 400,
  color: theme.palette.error.main,
  fontSize: "0.75rem",
}));

// Updated SnackbarWrapper
const SnackbarWrapper = styled("div")<{ success: boolean }>(({ theme, success }) => ({
  width: "100%",
  height: "100%",
  boxSizing: "border-box",
  padding: "16px",
  color: "#fff",
  boxShadow: theme.shadows[5],
  borderRadius: "4px",
  backgroundColor: success ? green["A700"] : red[900],
  overflow: "hidden",
}));

const CreateAccountPage = (props: Props) => {
  const theme = useTheme();
  const { emailVerificationCode } = useParams<{ emailVerificationCode?: string }>();
  const codeRef = useRef<any>();

  const [values, setValues] = useState<Values>({ email: "", code: "" });
  const [account, setAccount] = useState<Account>({ name: "", secretKey: "" });
  const [page, setPage] = useState("email");
  const [snackbarState, setSnackbarState] = useState<SnackbarState>({
    open: false,
    success: true,
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleCloseSnackbar = (event: any, reason?: string) => {
    if (reason === "clickaway") return;
    setSnackbarState({ ...snackbarState, open: false });
  };

  const handleCodeVerification = async (values: Values) => {
    setLoading(true);
    if (error) setError(false);
    const res = await userService.validateEmailVerification(values.email, values.code);
    if (res.isFailure) {
      setValues({ ...values, code: "" });
      setError(true);
    } else {
      setPage("form");
    }
    setLoading(false);
  };

  const tryPerformStep = async () => {
    setLoading(true);
    if (error) setError(false);

    if (page === "email") {
      const res = await userService.createEmailVerification(values.email);
      if (res.isFailure) setError(true);
      else setPage("code");
    } else if (page === "code") {
      // Handle code verification step
    } else if (page === "form") {
      const res = await accountService.createAccount({
        emailToken: { email: values.email, code: values.code },
        name: account.name,
      });
      if (res.isFailure) setError(true);
      else {
        setAccount({ ...account, secretKey: res.getValue().secretKey });
        setPage("success");
      }
    }
    setTimeout(() => setLoading(false), 600);
  };

  const displayCurrentPage = () => {
    switch (page) {
      case "email":
        return (
          <Fragment>
            <Typography variant="h5" component="h2" gutterBottom>
              Contact email
            </Typography>
            <Typography variant="body2" component="p" gutterBottom>
              This is the only personal information we will need from you before you can create your own nettu meet account.
            </Typography>
            <TextField
              required
              variant="filled"
              fullWidth
              label="Email"
              error={error}
              helperText={error ? "Invalid email. Might be malformed or a disposable email." : ""}
              margin="normal"
              autoFocus
              onKeyPress={(e) => {
                const code = e.keyCode ? e.keyCode : e.which;
                if (code !== 13) return;
                tryPerformStep();
              }}
              value={values.email}
              onChange={(e) => {
                if (error) setError(false);
                setValues({ ...values, email: e.target.value });
              }}
            />
            <Button
              onClick={() => tryPerformStep()}
              variant="contained"
              color="primary"
              size="large"
              disabled={
                values.email.length < 3 ||
                !values.email.includes("@") ||
                values.email.endsWith("@") ||
                values.email.startsWith("@")
              }
              sx={{ marginTop: "14px" }}
              fullWidth
            >
              SEND VERIFICATION CODE
            </Button>
          </Fragment>
        );
      case "code":
        return (
          <Fragment>
            <div style={{ margin: "0 auto", width: "370.4px", marginBottom: "20px" }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Check your email!
              </Typography>
              <Typography variant="body2" component="p" gutterBottom>
                We have sent you a 6-digit code to your inbox. Remember to check your spam folder.
              </Typography>
            </div>
            <VerificationCodeInput
              ref={codeRef}
              error={error}
              onComplete={(val) => {
                setValues({ ...values, code: val });
                handleCodeVerification({ email: values.email, code: val });
              }}
              onChange={() => { }}
            />
            {error && (
              <ErrorText align="center" component="p" style={{ margin: "12px", fontSize: "0.85rem" }}>
                Invalid code
              </ErrorText>
            )}
          </Fragment>
        );
      case "form":
        return (
          <Fragment>
            <Typography variant="h5" component="h2" gutterBottom>
              Create your meeting app
            </Typography>
            <Typography variant="body2" component="p" style={{ marginBottom: "16px" }}>
              Give a name to your Nettu meeting app. This can be changed later.
            </Typography>
            <form noValidate autoComplete="off">
              <TextField
                variant="filled"
                fullWidth
                error={error}
                label="Name"
                helperText={error ? "This name is already in use by someone else." : null}
                required
                onChange={(e) => {
                  setAccount((comp) => ({ ...comp, name: e.target.value }));
                  if (error) setError(false);
                }}
                value={account.name}
                margin="normal"
              />
              <Button
                color="primary"
                variant="contained"
                size="large"
                fullWidth
                disabled={account.name.length < 2}
                onClick={() => tryPerformStep()}
                sx={{ marginTop: "16px" }}
              >
                CREATE
              </Button>
            </form>
          </Fragment>
        );
      case "success":
        return (
          <Fragment>
            <Typography variant="h5" component="h2" gutterBottom>
              Success!
            </Typography>
            <Typography variant="body2" component="p" style={{ marginBottom: "16px" }}>
              You have successfully created a Nettu Meet account! Copy and store your API key securely and check out the documentation of how to get started.
            </Typography>
            <TextField
              variant="filled"
              fullWidth
              multiline
              InputProps={{
                readOnly: true,
                disabled: true,
                disableUnderline: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip placement="top" title="Copy to clipboard">
                      <IconButton
                        aria-label="copy API key"
                        onClick={() => copyTextToClipboard(account.secretKey)}
                      >
                        <img src={CopyIcon} alt="Copy" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              value={account.secretKey}
              label="API Key"
            />
            <Button
              color="primary"
              variant="contained"
              fullWidth
              sx={{ marginTop: "16px" }}
              onClick={() => window.location.href = `${apiConfig.docsUrl}`
              }
            >
              GET STARTED
            </Button>
          </Fragment>
        );
    }
  };

  return (
    <Fragment>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={snackbarState.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
      >
        <SnackbarWrapper success={snackbarState.success}>
          <Typography variant="body2">{snackbarState.message}</Typography>
        </SnackbarWrapper>
      </Snackbar>
      <PaperWrapper>
        {loading ? (
          <LoadingDialog>
            <NettuProgress onDone={() => { console.log('Progress done'); }} duration={5000} />
          </LoadingDialog>
        ) : (
          displayCurrentPage()
        )}
      </PaperWrapper>
    </Fragment>
  );
};

export default CreateAccountPage;
