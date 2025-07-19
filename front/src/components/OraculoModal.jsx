import React, { useState } from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  useTheme, 
  IconButton,
  FormHelperText 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { format, parseISO, isValid } from 'date-fns';

const OraculoModal = ({ open, onClose, onConfirm }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    dataNascimento: null
  });
  const [errors, setErrors] = useState({
    nome: false,
    telefone: false,
    dataNascimento: false
  });
const validatePhone = (phone) => {
  const phoneRegex = /^\(?[1-9]{2}\)?\s?[9]?[6-9]\d{3}-?\d{4}$/;
  return phoneRegex.test(phone);
};


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validação em tempo real
    if (name === 'telefone') {
      setErrors(prev => ({ ...prev, telefone: !validatePhone(value) }));
    } else if (name === 'nome') {
      setErrors(prev => ({ ...prev, nome: value.trim().length < 3 }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, dataNascimento: date }));
    setErrors(prev => ({ ...prev, dataNascimento: !date || !isValid(date) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validações finais
    const newErrors = {
      nome: formData.nome.trim().length < 3,
      telefone: !validatePhone(formData.telefone),
      dataNascimento: !formData.dataNascimento || !isValid(formData.dataNascimento)
    };

    setErrors(newErrors);

    if (!Object.values(newErrors).some(error => error)) {
      const formattedData = {
        ...formData,
        dataNascimento: format(formData.dataNascimento, 'yyyy-MM-dd')
      };
      onConfirm(formattedData);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="oraculo-modal-title">
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: '450px' },
          bgcolor: theme.palette.background.paper,
          boxShadow: 24,
          p: 4,
          borderRadius: '8px',
          border: `1px solid ${theme.palette.secondary.main}`,
          outline: 'none'
        }}
      >
        <IconButton
          aria-label="fechar"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: theme.palette.text.primary,
            '&:hover': {
              color: theme.palette.secondary.main
            }
          }}
        >
          <CloseIcon />
        </IconButton>

        <Typography
          id="oraculo-modal-title"
          variant="h5"
          component="h2"
          sx={{
            mb: 3,
            color: theme.palette.secondary.main,
            fontFamily: theme.typography.h1.fontFamily,
            textAlign: 'center',
            fontWeight: 700
          }}
        >
          Antes de Consultar
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          <Box>
            <TextField
              required
              fullWidth
              label="Nome Completo"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              variant="outlined"
              error={errors.nome}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: theme.palette.secondary.main,
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.secondary.main,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.text.primary,
                }
              }}
              InputProps={{
                sx: {
                  color: theme.palette.text.primary,
                }
              }}
            />
            {errors.nome && (
              <FormHelperText error sx={{ ml: 2 }}>
                Nome deve ter pelo menos 3 caracteres
              </FormHelperText>
            )}
          </Box>

          <Box>
            <TextField
              required
              fullWidth
              label="Telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              variant="outlined"
              error={errors.telefone}
              inputProps={{
                maxLength: 15
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: theme.palette.secondary.main,
                  },
                },
              }}
              InputProps={{
                sx: {
                  color: theme.palette.text.primary,
                }
              }}
            />
            {errors.telefone && (
              <FormHelperText error sx={{ ml: 2 }}>
                Digite um telefone válido (DDD) + número
              </FormHelperText>
            )}
          </Box>

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
            <DatePicker
              label="Data de Nascimento"
              value={formData.dataNascimento}
              onChange={handleDateChange}
              maxDate={new Date()}
              openTo="year"
              views={['year', 'month', 'day']}
              renderInput={(params) => (
                <Box>
                  <TextField
                    {...params}
                    fullWidth
                    required
                    error={errors.dataNascimento}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: theme.palette.secondary.main,
                        },
                      },
                    }}
                    InputProps={{
                      ...params.InputProps,
                      sx: {
                        color: theme.palette.text.primary,
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        color: theme.palette.text.primary,
                      }
                    }}
                  />
                  {errors.dataNascimento && (
                    <FormHelperText error sx={{ ml: 2 }}>
                      Selecione uma data válida
                    </FormHelperText>
                  )}
                </Box>
              )}
            />
          </LocalizationProvider>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{
              mt: 2,
              bgcolor: theme.palette.secondary.main,
              color: theme.palette.background.default,
              '&:hover': {
                bgcolor: theme.palette.secondary.dark,
              },
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 'bold',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}
          >
            Confirmar Consulta
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default OraculoModal;