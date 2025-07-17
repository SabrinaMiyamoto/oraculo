import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const menuItems = [
  { label: 'Início', id: 'inicio' },
  { label: 'Oráculo', id: 'oraculo' },
  { label: 'Contato', id: 'contato' },
];

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleScroll = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setDrawerOpen(false);
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: theme.palette.background.default, 
          borderBottom: `1px solid ${theme.palette.secondary.main}20`, 
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              fontWeight: 700,
              color: theme.palette.text.primary, 
              cursor: 'pointer',
              fontFamily: theme.typography.h1.fontFamily, 
              fontSize: '1.5rem', 
              '&:hover': { 
                color: theme.palette.secondary.main, 
              },
              transition: 'color 0.3s ease',
            }}
            onClick={() => handleScroll('inicio')}
          >
            Yá Bete de Odé
          </Typography>

          {isMobile ? (
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menu"
              sx={{ 
                color: theme.palette.text.primary, 
                '&:hover': {
                  color: theme.palette.secondary.main, 
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 4 }}>
              {menuItems.map((item) => (
                <Typography
                  key={item.id}
                  variant="body1"
                  onClick={() => handleScroll(item.id)}
                  sx={{
                    cursor: 'pointer',
                    color: theme.palette.text.primary, 
                    '&:hover': {
                      color: theme.palette.secondary.main, 
                    },
                    transition: 'color 0.3s ease',
                    fontWeight: 500,
                    py: 1,
                  }}
                >
                  {item.label}
                </Typography>
              ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer Mobile */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            width: '70%',
            maxWidth: '250px',
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.id}
                onClick={() => handleScroll(item.id)}
                sx={{
                  '&:hover': {
                    '& .MuiListItemText-primary': {
                      color: theme.palette.secondary.main,
                    }
                  },
                }}
              >
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{
                    sx: { 
                      color: theme.palette.text.primary, 
                      fontFamily: theme.typography.fontFamily,
                    }
                  }} 
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Toolbar /> {/* Espaço reservado */}
    </>
  );
};

export default Header;