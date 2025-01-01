import { Typography, useTheme } from "@mui/material";
import { styled } from "@mui/system";
import { Fragment } from "react";

// Define interface for the Page
interface Page {
  id: string;
  active: boolean;
}

// Define props for the PageMenu component
interface Props {
  pages: Page[];
  onChange: (id: string) => void;
  onCreate: () => void;
}

// Define a styled container for the page button
const PageContainer = styled("div")({
  width: "30px",
  height: "30px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgb(41, 56, 69)",
  borderRadius: "4px",
  transition: "background 0.3s ease",
  "&:hover": {
    background: "linear-gradient(rgb(143, 43, 224) 0%, rgb(156, 66, 228) 100%)",
    cursor: "pointer",
  },
});

// Define a styled container for the active page button
const ActivePageContainer = styled(PageContainer)({
  background: "linear-gradient(rgb(143, 43, 224) 0%, rgb(156, 66, 228) 100%)",
  cursor: "pointer",
});

// Define styled Typography for the page number
const PageLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  fontWeight: 400,
  fontSize: "0.9rem",
}));

// Define the PageMenu component
export const PageMenu = ({ pages, onChange, onCreate }: Props) => {
  const theme = useTheme();

  // Function to handle page click
  const handlePageClick = (id: string, active: boolean) => {
    if (!active) {
      onChange(id);
    }
  };

  return (
    <Fragment>
      {pages.map((page, index) => (
        // Use ActivePageContainer if active, otherwise use PageContainer
        <div
          key={page.id}
          onClick={() => handlePageClick(page.id, page.active)}
        >
          {page.active ? (
            <ActivePageContainer>
              <PageLabel>{index + 1}</PageLabel>
            </ActivePageContainer>
          ) : (
            <PageContainer>
              <PageLabel>{index + 1}</PageLabel>
            </PageContainer>
          )}
        </div>
      ))}
      {pages.length < 15 && (
        <PageContainer onClick={onCreate}>
          <PageLabel>+</PageLabel>
        </PageContainer>
      )}
    </Fragment>
  );
};
