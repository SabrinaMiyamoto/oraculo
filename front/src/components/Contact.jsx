import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from 'react-router-dom';

export default function ContactSection() {
  const navigate = useNavigate(); 

  const handleAgendarConsultaClick = () => {
    navigate('/agendamento-online'); 
  };

  return (
    <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        Agende sua Consulta
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center", mt: 2 }}>
        <Button
          variant="contained"
          color="success"
          href="https://api.whatsapp.com/send?phone=+5548988115385&text=Olá%2C%20gostaria%20de%20agendar%20uma%20consulta."
          target="_blank"
        >
          WhatsApp
        </Button>

        <Button
          variant="outlined"
          color="primary"
          onClick={handleAgendarConsultaClick}
        >
          Agendar consulta
        </Button>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Localização
        </Typography>
        <iframe
          title="Localização - Florianópolis"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15443.056667823533!2d-48.5476110287114!3d-27.5953043232187!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x952739268686f7b7%3A0x63351f78e4d3c32!2sFlorian%C3%B3polis%2C%20SC!5e0!3m2!1spt-BR!2sbr!4v1719602000000!5m2!1spt-BR!2sbr" 
          width="100%"
          height="300"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </Box>
    </Box>
  );
}