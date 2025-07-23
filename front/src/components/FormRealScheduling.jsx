// front/src/FormRealScheduling.jsx

import React, { useState, useEffect, useMemo } from 'react'; // Adicionado useMemo
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale'; // Importe o locale português

import { 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    CircularProgress, 
    Box, 
    TextField, 
    Button,
    Typography,
    Alert
} from '@mui/material'; 

const FormRealScheduling = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    // availableSlots agora armazena TODOS os slots disponíveis com data e hora
    const [allAvailableSlots, setAllAvailableSlots] = useState([]); 
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [timeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    

    const formatDateDisplay = (dateString) => {

        const date = new Date(dateString + 'T00:00:00'); 
        return format(date, 'EEEE, dd/MM/yyyy', { locale: ptBR }); // Usando ptBR importado
    };

    // Função para buscar TODOS os slots disponíveis (datas e horários)
    const fetchAllAvailableSlots = async () => {
        setLoading(true); // Define loading para true ao iniciar a busca
        setError('');
        try {

            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/slots/available-dates`); 

            
            setAllAvailableSlots(response.data); // Armazena todos os slots
        } catch (err) {
            setError('Erro ao carregar horários disponíveis. Tente novamente mais tarde.');
            console.error('Error fetching all available slots:', err);
        } finally {
            setLoading(false);
        }
    };

    // Use useEffect para buscar todos os slots na montagem do componente
    useEffect(() => {
        fetchAllAvailableSlots();
    }, []);

    // Use useMemo para calcular as datas únicas a partir de allAvailableSlots
    // Isso evita recalcular a cada renderização desnecessária
    const uniqueAvailableDates = useMemo(() => {
        const dates = new Set(); // Usar um Set para garantir unicidade
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        sevenDaysFromNow.setHours(23, 59, 59, 999); // Incluir o final do 7º dia

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        allAvailableSlots.forEach(slot => {
            const slotDateTime = new Date(`${slot.date}T${slot.time}`);
            // Filtra por slots futuros e dentro dos próximos 7 dias
            if (slotDateTime >= today && slotDateTime <= sevenDaysFromNow && !slot.isBooked) {
                dates.add(slot.date); // Adiciona apenas a string da data
            }
        });
        // Converte o Set de volta para um array e ordena
        return Array.from(dates).sort((a, b) => new Date(a) - new Date(b));
    }, [allAvailableSlots]);


    // Use useMemo para filtrar os horários com base na data selecionada
    const availableTimesForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        return allAvailableSlots
            .filter(slot => slot.date === selectedDate && !slot.isBooked) // Filtra pela data e se não está reservado
            .sort((a, b) => a.time.localeCompare(b.time)); // Ordena os horários
    }, [selectedDate, allAvailableSlots]);

    // Quando a data selecionada muda, reseta o horário selecionado
    useEffect(() => {
        setSelectedTimeSlot('');
    }, [selectedDate]);

    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
    };

    const handleTimeSelect = (event) => {
        setSelectedTimeSlot(event.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !email || !selectedTimeSlot) {
            setError('Por favor, preencha todos os campos e selecione um horário.');
            return;
        }

        let parsedSlot;
        try {
            parsedSlot = JSON.parse(selectedTimeSlot);
        } catch (parseError) {
            setError('Erro ao processar o horário selecionado. Tente novamente.');
            return;
        }

        const fullDateTime = `${parsedSlot.date}T${parsedSlot.time}:00`; 
        
        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/client/agendar`, {
                nome: name,
                email,
                dateTime: fullDateTime,
                timeZone,
                slotId: parsedSlot._id
            });

            setMessage(response.data.message);
            setError('');
            setName('');
            setEmail('');
            setSelectedDate('');
            setSelectedTimeSlot('');

            // Após agendar, recarrega todos os slots para refletir a mudança
            fetchAllAvailableSlots(); 

        } catch (submitError) {
            setError(submitError.response?.data?.error || 'Ocorreu um erro ao agendar. Tente novamente.');
            setMessage('');
        }
    };

    return (
        <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ 
                mt: 3, 
                maxWidth: 500, 
                mx: 'auto', 
                p: 3,
                border: '1px solid #ccc', 
                borderRadius: '8px',
                boxShadow: 3
            }}
        >
            <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
                Agendar Horário
            </Typography>

            <TextField
                label="Seu Nome"
                variant="outlined"
                fullWidth
                margin="normal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            />

            <TextField
                label="Seu E-mail"
                variant="outlined"
                fullWidth
                margin="normal"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />

            <FormControl fullWidth margin="normal" required>
                <InputLabel id="select-date-label">Selecione a Data</InputLabel>
                <Select
                    labelId="select-date-label"
                    value={selectedDate}
                    onChange={handleDateChange}
                    label="Selecione a Data"
                    disabled={loading}
                    displayEmpty
                >
                    {loading ? (
                        <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 1 }} /> Carregando datas disponíveis...
                        </MenuItem>
                    ) : uniqueAvailableDates.length > 0 ? (
                        uniqueAvailableDates.map(date => (
                            <MenuItem key={date} value={date}> {/* 'date' é único aqui, então pode ser a key */}
                                {formatDateDisplay(date)}
                            </MenuItem>
                        ))
                    ) : (
                        <MenuItem value="" disabled>Nenhuma data disponível nos próximos 7 dias.</MenuItem>
                    )}
                </Select>
            </FormControl>

            {selectedDate && (
                <FormControl fullWidth margin="normal" required>
                    <InputLabel id="select-time-label">Selecione o Horário</InputLabel>
                    <Select
                        labelId="select-time-label"
                        value={selectedTimeSlot} 
                        onChange={handleTimeSelect}
                        label="Selecione o Horário"
                        disabled={loading} // Use o loading geral
                        displayEmpty
                    >
                        {loading ? (
                            <MenuItem disabled>
                                <CircularProgress size={20} sx={{ mr: 1 }} /> Carregando horários...
                            </MenuItem>
                        ) : availableTimesForSelectedDate.length > 0 ? (
                            availableTimesForSelectedDate.map((slot) => (
                                <MenuItem key={slot._id} value={JSON.stringify(slot)}> {/* AGORA SIM, use slot._id como a key única! */}
                                    {slot.time}
                                </MenuItem>
                            ))
                        ) : (
                            <MenuItem value="" disabled>Nenhum horário disponível para esta data.</MenuItem>
                        )}
                    </Select>
                </FormControl>
            )}

            {message && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    {message}
                </Alert>
            )}
            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}
            <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 3 }}
                disabled={loading || !name || !email || !selectedDate || !selectedTimeSlot} 
            >
                Agendar Horário
            </Button>
        </Box>
    );
};

export default FormRealScheduling;