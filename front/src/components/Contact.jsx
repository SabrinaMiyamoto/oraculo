import { Box, Button, Typography } from "@mui/material";

export default function ContactSection() {
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
          href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Consulta+espiritual+com+a+Mãe+de+Santo&dates=20250720T120000Z/20250720T130000Z&details=Consulta+espiritual&location=Florianópolis"
          target="_blank"
        >
          Agendar consulta presencial
        </Button>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Localização
        </Typography>
        <iframe
          title="Localização - Florianópolis"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d56570.07227276175!2d-48.5492504!3d-27.5929232!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x952738248efc5a6b%3A0x6e9343d29b4890a5!2sFlorian%C3%B3polis%2C%20SC!5e0!3m2!1spt-BR!2sbr!4v1718731234567!5m2!1spt-BR!2sbr" 
          width="100%"
          height="300"
          style={{ border: 0 }}
          loading="lazy"
        ></iframe>
      </Box>
    </Box>
  );
}
