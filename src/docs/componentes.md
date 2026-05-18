# Documentacion de Componentes

Este simulador trabaja con componentes ideales para analisis de circuitos basicos en DC.

## Resistencia

### Que es
Una resistencia limita el paso de corriente y disipa energia en forma de calor.

### Fisica
- Se modela con la ley de Ohm.
- En un material conductor, la oposicion depende de geometria y resistividad.

### Formulas
- `V = I * R`
- `P = V * I = I^2 * R = V^2 / R`
- `R = rho * L / A`

### Variaciones comunes
- Carbon film, metal film, wirewound.
- Tolerancias tipicas: 1%, 5%, 10%.
- Coeficiente termico (TCR).

## Capacitor

### Que es
Un capacitor almacena energia en un campo electrico entre dos placas.

### Fisica
- La carga acumulada genera diferencia de potencial.
- En DC ideal, a regimen permanente se comporta como circuito abierto.

### Formulas
- `Q = C * V`
- `i(t) = C * dv(t)/dt`
- `E = 0.5 * C * V^2`
- Reactancia (AC): `Xc = 1 / (2 * pi * f * C)`

### Variaciones comunes
- Ceramico, electrolitico, tantalio, film.
- ESR y fuga no ideales.
- Polarizados y no polarizados.

## Inductor

### Que es
Un inductor almacena energia en un campo magnetico generado por corriente.

### Fisica
- Se opone a cambios bruscos de corriente.
- En DC ideal, a regimen permanente se aproxima a cortocircuito.

### Formulas
- `v(t) = L * di(t)/dt`
- `E = 0.5 * L * I^2`
- Reactancia (AC): `XL = 2 * pi * f * L`

### Variaciones comunes
- Nucleo de aire, ferrita o hierro.
- Resistencia serie del bobinado (DCR).
- Saturacion magnetica en nucleos ferromagneticos.

## Bateria (Fuente de Voltaje)

### Que es
Una bateria se modela como fuente que mantiene una diferencia de potencial.

### Fisica
- Convierte energia quimica en electrica.
- En la practica tiene resistencia interna.

### Formulas
- Modelo ideal: `V = constante`
- Modelo simple no ideal: `V_terminal = E - I * r_interna`
- Potencia entregada: `P = V * I`

### Variaciones comunes
- Quimicas: alcalina, litio-ion, plomo-acido.
- Parametros: capacidad (Ah), voltaje nominal, tasa de descarga.

## Notas de simulacion

- Este entorno usa modelos simplificados para aprendizaje y diseno conceptual.
- En analisis avanzados se incorporan no idealidades (ESR, saturacion, temperatura, ruido).
