|     | 1   | 2   | 3   |     |     | 4   |     |     | 5   |     |     | 6   |     | 7    |     |     | 8   |     |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---- | --- | --- | --- | --- |
| IO  |     |     |     |     |     |     |     |     |     |     |     |     |     | SRAM |     |     |     |     |
MCU
COU2  U 2
|     |     | GN D |     |     |     |     |     |     |     |     |     |     |     | FSMC_A6 | 1   | A 0 I / O 1 5 3 8 | FSMC_D15 |     |
| --- | --- | ---- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ------- | --- | ----------------- | -------- | --- |
GN D VCC 3 .3 V C C5 FSMC_A7 PIU201  2 A 1 I / O 1 4 PIU2038  3 7 FSMC_D14
W K _ U P P A 0 3 4 CUOU11  106 FSMC_A8 PIU202  3 A 2 I / O 1 3 PIU2037  3 6 FSMC_D13
P I U 1 0 3 4   P A 0 - W K U P / U S A R T 2 _ C T S / A D C 1 2 3 _ IN 0 / T IM 5 _ C H 1 / T IM 2_CH1_ETR/TIM8_ETR NC P I U 1 0 1 0 6   FSMC_A9 P I 4 U 2 0 3   P I U 2 3 0 3 5 6   FSMC_D12
P I J P 1 0 1   1 2 P I J P 1 0 2   P I J P 2 0 1   1 2 P I J P 2 0 2   S T M _ A D C P A 1 P 3 I U 5 1 0 3 5   P A 1 / U S A R T 2 _ R T S /A D C 1 2 3 _ IN 1 / T I M 5 _ C H 2 /T IM 2 _ C H 2 FSMC_A10 P I 5 U 2 0 4   A 3 I / O 1 2 P I U 2 3 0 3 2 5   FSMC_D11
R E S ET P I J P 1 0 3   3 4 P I J P 1 0 4   P I J P 2 0 3   3 4 P I J P 2 0 4   U S A R T 2 _ T X P A 2 P 3 I U 6 1 0 3 6   P A 2 / U S A R T 2 _ T X / A D C 1 2 3 _ I N 2 / T I M 5 _ C H 3 / T I M 2 _ C H 3 PE0/TIM4_ET R /F S M C _ N B L 0 P I U 1 0 1 1 4 4 1   1 P E 0 F S M C _ N B L 0 F S M C _ A 2 P 1 I 8 U 2 0 5   A 4 I / O 1 1 P I U 2 3 0 3 1 2   F S M C _ D 1 0
P A 1 PIJP105  5 6 PIJP106  V R EF V B A T PIJP205  5 6 PIJP206  P B 4 U S A R T 2 _ R X P A 3 PIU1037  3 7 P A 3 / U S A R T 2 _ R X / A D C 1 2 3 _ I N 3 / T I M 5 _ C H 4 / T I M 2 _ C H 4 PE 1 /F S M C _ N B L 1 PIU10142  1 4 2 P E 1 F S M C _ N B L 1 F S M C _ A 1 2 P 1 I 9 U 2 0 1 8   A 5 I / O 1 0 P I U 2 3 0 3 0 1   F S M C _ D 9
A P B 1 1 P I J P 1 0 7   7 8 P I J P 1 0 8 P   A 2 P B 3 P I J P 2 0 7   7 8 P I J P 2 0 8 P   G 1 5 S T M _ D A C P A 4 P 4 I U 0 1 0 4 0   P A 4 / S P I 1 _ N S S / D A C _ O U T 1 / U S A R T 2 _ C K / A D C 1 2 _ I N 4 P E 2 / T R A C E C K / F S M C _ A 2 3 P I U 1 1 0 1   P E 2 F S M C _ A 1 3 P 2 I 0 U 2 0 1 9   A 6 I / O 9 P I U 2 2 0 3 9 0   F S M C _ D 8 A
P A 3 P I J P 1 0 9   9 1 0 P I J P 1 0 1 0 P   B 1 0 P G 1 4 P I J P 2 0 9   9 1 0 P I J P 2 0 1 0 P   G 1 3 S P I 1 _ S C K P A 5 P 4 I U 1 1 0 4 1   P A 5 / S P I 1 _ SC K / D A C _ O U T 2 / A D C 1 2 _ I N 5 P E 3 / T R A C E D 0 / F S M C _ A 1 9 P I U 1 2 0 2   P E 3 F S M C _ A 1 4 P 2 I U 1 2 0 2 0   A 7 I / O 8 P I U 2 1 0 2 6 9   F S M C _ D 7
P A 5 1 1 1 2 P A 4 P E 3 1 1 1 2 P E 2 S P I 1 _ M I S O P A 6 4 2 P A 6 / S P I 1 _ M I S O / T I M 8 _ B K I N / A D C 1 2 _ I N 6 / T I M 3 _ C H 1 P E 4 / T R A C E D 1 / F S M C _ A 2 0 3 P E 4 K E Y 0 F S M C _ A 1 5 P 2 I 2 U 2 0 2 1   A 8 I / O 7 P I U 2 1 0 1 5 6   F S M C _ D 6
P A 7 P I J P 1 0 1 1   1 3 1 4 P I J P 1 0 1 2 P   A 6 P E 6 P I J P 2 0 1 1   1 3 1 4 P I J P 2 0 1 2 P   C13 S P I 1 _ M O S I P A 7 P 4 I U 3 1 0 4 2   P A 7 / S P I 1 _ M O S I / T I M 8 _ C H 1 N / A D C 1 2 _ I N 7 / T I M 3 _ C H 2 P E 5 / T R A C E D 2 / F S M C _ A 2 1 P I U 1 4 0 3   P E 5 L E D 1 F S M C _ A 1 6 P 2 I U 3 2 0 2 2   A 9 I / O 6 P I U 2 1 0 1 4 5   F S M C _ D 5
P C 5 P I J P 1 0 1 3   1 5 1 6 P I J P 1 0 1 4 P   C 4 P E 1 P I J P 2 0 1 3   1 5 1 6 P I J P 2 0 1 4 P   E 0 PW M _ D A C O V _ V S Y N C P A 8 1 P 0 I U 0 1 0 4 3   P A 8 / U S A R T 1 _ C K / T I M 1 _ C H 1 / M C O P E 6 / T R A C E D 3 / F S M C _ A 2 2 P I U 1 5 0 4   P E 6 F S M C _ A 1 7 P 2 I 4 U 2 0 2 3   A 1 0 I / O 5 P I U 2 1 0 1 3 4   F S M C _ D 4
P B 2 P I J P 1 0 1 5   1 7 1 8 P I J P 1 0 1 6 P   B 1 PB9P I J P 2 0 1 5   1 7 1 8 P I J P 2 0 1 6 P  B8 U S A R T 1 _ T X P A 9 1 P 0 I U 1 1 0 1 0 0   P A 9 / U S A R T 1 _ T X / T I M 1 _ C H 2 P E 7 / F S M C _ D 4 P I U 1 5 0 8 5   P E 7 F S M C _ D 4 F S M C _ A 1 8 P 2 I U 5 2 0 2 4   A 1 1 I / O 4 P I U 2 1 0 1 0 3   F S M C _ D 3
PF10 P I J P 1 0 1 7   P I J P 1 0 1 8 P   F 1 1 P G 1 1 P I J P 2 0 1 7   P I J P 2 0 1 8 P   G 9 U S A R T 1 _ R X P A 1 0 1 P 0 I U 2 1 0 1 0 1   P I U 1 5 0 5 9 8   P E 8 F S M C _ D 5 P I U 2 0 2 5   A 1 2 I / O 3 P I U 2 0 1 0
P F 8 P I J P 1 0 1 9   1 9 2 0 P I J P 1 0 2 0 P   F9 P D 7 P I J P 2 0 1 9   1 9 2 0 P I J P 2 0 2 0 P   D6 U S B _ D - P A 1 1 1 P 0 I U 3 1 0 1 0 2   P A 1 0 / U S A R T 1 _ R X /T IM 1 _ C H 3 P E 8 / F S M C _ D 5 P I U 1 6 0 5 0 9   P E 9 F S M C _ D 6 F S M C _ A 5 P 2 I 6 U 2 0 2 6   A 1 3 I / O 2 P I U 2 9 0 9   F S M C _ D 2
P D 1 1 P I J P 1 0 2 1   2 1 2 2 P I J P 1 0 2 2 P   F 7 P D 5 P I J P 2 0 2 1   2 1 2 2 P I J P 2 0 2 2 P   D 4 U S B _ D + P A 1 2 1 P 0 I U 4 1 0 1 0 3   P A 1 1 / U S A R T 1 _ C T S / C A N _ R X / T I M 1 _ C H 4 / U S B D M P E 9 / F S M C _ D 6 P I U 1 6 0 6 3 0   P E 1 0 F S M C _ D 7 F S M C _ A 4 P 2 I 7 U 2 0 2 7   A 1 4 I / O 1 P I U 2 8 0 8   F S M C _ D 1
P D 1 3 P I J P 1 0 2 3   2 3 2 4 P I J P 1 0 2 4 P   D 1 2 P D 3 P I J P 2 0 2 3   2 3 2 4 P I J P 2 0 2 4 P   D 1 S W D I O P A 1 3 1 P 0 I U 5 1 0 1 0 4   P A 1 2 / U S A R T 1 _ R T S / C A N _ T X / T I M 1 _ E T R / U S B D P P E 1 0 / F S M C _ D 7 P I U 1 6 0 6 4 3   P E 1 1 F S M C _ D 8 F S M C _ A 1 P 4 I 2 U 2 0 4 2   A 1 5 I / O 0 P I U 2 7 0 7   F S M C _ D 0
P F 4 P I J P 1 0 2 5   2 5 2 6 P I J P 1 0 2 6 P   F 5 P D 0 P I J P 2 0 2 5   2 5 2 6 P I J P 2 0 2 6 P   A 1 5 S W D C LK P A 1 4 1 P 0 I U 9 1 0 1 0 5   P A 1 3 / J T M S _ S W D I O P E 1 1 / F S M C _ D 8 P I U 1 6 0 6 5 4   P E 1 2 F S M C _ D 9 F S M C _ A 0 P 4 I U 3 2 0 4 3   A 1 6
P E 1 1 P I J P 1 0 2 7   2 7 2 8 P I J P 1 0 2 8 P   F 3 P F6 P I J P 2 0 2 7   2 7 2 8 P I J P 2 0 2 8 P   C 3 P A 1 5 11 P I U 0 1 0 1 0 9   P A 1 4 / J T C K _S W C L K P E 1 2 / F S M C _ D 9 P I U 1 6 0 6 6 5   P E 1 3 F S M C _ D 1 0 F S M C _ A 1 1 P 4 I 4 U 2 0 4 4   A 1 7
P E 1 2 P I J P 1 0 2 9   2 9 3 0 P I J P 1 0 3 0 P   E 1 0 P C 2 P I J P 2 0 2 9   2 9 3 0 P I J P 2 0 3 0 P   C 1 P I U 1 0 1 1 0   P A 1 5 / J T D I/S P I3_ N S S/I2S3_WS P E 1 3 / F S M C _ D 1 0 P I U 1 6 0 6 7 6   P E 1 4 F S M C _ D 1 1 F S M C _ A 3 2 8 A 1 8 /N C U B 4 0 F S M C _ N B L 1
P E 1 4 P I J P 1 0 3 1   3 1 3 2 P I J P 1 0 3 2 P   E 1 3 P C 0 P I J P 2 0 3 1   3 1 3 2 P I J P 2 0 3 2 P   A 1 1 L C D _ B L P B 0 4 6 P E 1 4 / F S M C _ D 1 1 P I U 1 6 0 6 8 7   P E 1 5 F S M C _ D 1 2 P I U 2 0 2 8   L B P I U 2 3 0 4 9 0   F S M C _ N B L 0
P E 8 P I J P 1 0 3 3   3 3 3 4 P I J P 1 0 3 4 P   E 9 PA 1 2 P I J P 2 0 3 3   3 3 3 4 P I J P 2 0 3 4 P   B14 T _ S C K P B 1 P 4 I U 7 1 0 4 6   P B 0 / A D C 1 2 _ I N 8 / T I M 3 _ C H 3 / T I M 8 _ C H 2 N P E 1 5 / F S M C _ D 1 2 P I U 1 0 6 8   P I C 2 V0 1   S 1 1 1 V D D O E P I U 2 4 0 3 1 9   F S M C _ N O E
P E 1 5 P I J P 1 0 3 5   3 5 3 6 P I J P 1 0 3 6 P   E 7 P C 1 2 P I J P 2 0 3 5   3 5 3 6 P I J P 2 0 3 6 P   D 2 T _ M I S O B O O T 1 P B 2 P 4 I U 8 1 0 4 7   P B 1 / A D C 1 2 _ I N 9 / T I M 3 _ C H 4 / T I M 8 _ C H 3 N 1 0 P F 0 F S M C _ A 0 V S 2 P 3 I U 3 2 0 1 1   V D D W E P I U 2 1 0 4 7 1   F S M C _ N W E C R OR 1  1 VCC3.3M
P I J P 1 0 3 7   3 7 3 8 P I J P 1 0 3 8   P I J P 2 0 3 7   3 7 3 8 P I J P 2 0 3 8   P I U 1 0 4 8   P B 2 / BO O T 1 P F 0 / F S M C _ A 0 P I U 1 0 1 0   P I C 2 0 2   COC C 2  2 P I C 1 0 1   P 1 I 2 U 2 0 3 3   P I U 2 6 0 1 7   F S M C _ N E 3
P D 9 P I J P 1 0 3 9   3 9 4 0 P I J P 1 0 4 0 P   D 8 P C 1 1 P I J P 2 0 3 9   3 9 4 0 P I J P 2 0 4 0 P   C 1 0 F I F O _ W E N P B 3 1 P 3 I U 3 1 0 1 3 3   P B 3 / J T D O / T R A C E S W O / S P I3 _ S C K / I 2 S 3_ CK P F 1 / F S M C _ A 1 P I U 1 1 0 1 1 1   P F 1 F S M C _ A 1 10 UF P I C 1 0 2   C COC 1 1  P 3 I 4 U 2 0 1 2   G N D C E P I U 2 0 6   P I R 1 0 1   1 0K PIR102
PF1 P I J P 1 0 4 1   4 1 4 2 P I J P 1 0 4 2 PD10   PB13 P I J P 2 0 4 1   4 1 4 2 P I J P 2 0 4 2 PB15   F I F O _ R C L K P B 4 1 P 3 I U 4 1 0 1 3 4   P B 4 / J N T R S T / S P I 3 _ M I S O P F 2 / F S M C _ A 2 P I U 1 1 0 1 2 2   P F 2 F S M C _ A 2 10 U P I F U 2 0 3 4   G N D C O R 6   VC C 3 . 3 M
PD15 P I J P 1 0 4 3   4 3 4 4 P I J P 1 0 4 4 PF0   PA8 P I J P 2 0 4 3   4 3 4 4 P I J P 2 0 4 4 PC9   L E D 0 P B 5 1 P 3 I U 5 1 0 1 3 5   P B 5 / I 2 C 1 _ S M B A I / S P I 3 _ M O S I / I2 S 3 _ S D P F 3 / F S M C _ A 3 P I U 1 1 0 1 3 3   P F 3 F S M C _ A 3 IS 61 L V 51 2 1 6 V S 1 R 6
PF15 4 5 4 6 PD14 PC8 4 5 4 6 PC7 I I C _ S C L P B 6 1 3 6 P B 6 / I 2 C 1 _ S C L / T I M 4 _ C H 1 P F 4 / F S M C _ A 4 1 4 P F 4 F S M C _ A 4 P I R 6 0 1 C O  R 2 7   R P I R 6 0 2
PF13 P I J P 1 0 4 5   4 7 4 8 P I J P 1 0 4 6 P  F14 PC6 P I J P 2 0 4 5   4 7 4 8 P I J P 2 0 4 6 PG8   I I C _ S D A P B 7 1 P 3 I U 7 1 0 1 3 6   P B 7 / I 2 C 1 _ S D A / F S M C _ N A D V / T I M 4 _ C H 2 P F 5 / F S M C _ A 5 P I U 1 1 0 1 5 4   P F 5 F S M C _ A 5 V S 2 R 7
PB0 P I J P 1 0 4 7   4 9 5 0 P I J P 1 0 4 8 PF12   PG7 P I J P 2 0 4 7   4 9 5 0 P I J P 2 0 4 8 PG6   B E E P P B 8 1 P 3 I U 9 1 0 1 3 7   P B 8 / T I M 4 _ C H 3 / S D I O _ D 4 P F 6 / A D C 3 _ I N 4 / F S M C _ N I O R D P I U 1 1 0 1 8 5   P F 6 P I R 7 0 1   2 R P I R 7 0 2
P I J P 1 0 4 9   P I J P 1 0 5 0   P I J P 2 0 4 9   P I J P 2 0 5 0   P B 9 1 P 4 I U 0 1 0 1 3 9   P B 9 / T I M 4 _ C H 4 / S D I O _ D 5 P F 7 / A D C 3 _ I N 5 / F S M C _ N R E G P I U 1 1 0 1 9 8   P F 7 GND
COJP1  JP1 COJP2  JP2 USART3_TX PB10 PIU10140  6 9 P B 1 0 / I 2 C 2 _ S C L/ U S A R T 3 _ T X P F 8 / A D C 3 _ I N 6 / F S M C _ N I O W R PIU1019  2 0 PF8
|     |     |     | USART3_RX | PB11 | PIU1069  7 0           |                                                |                             |           |                     |                           | PIU1020  2 1 PF9  | T_MOSI  |     |     |     |     |     |     |
| --- | --- | --- | --------- | ---- | ---------------------- | ---------------------------------------------- | --------------------------- | --------- | ------------------- | ------------------------- | ----------------- | ------- | --- | --- | --- | --- | --- | --- |
|     |     |     | F_CS      | PB12 | PIU1070  7 3 P B 11 /  | I 2 C 2 _ S D A / U S A R T 3 _ R X            |                             |           | P F 9 / A D C       | 3 _ I N 7 / F S M C _ C D | PIU1021  2 2 PF10 | T_PEN   |     |     |     |     |     |     |
|     |     |     | SPI2_SCK  | PB13 | PIU1073  7 4 P B 1 2 / | S P I 2 _ N S S / I 2 S 2 _ W S /I 2 C 2 _ S M | B A I /U S A R T 3 _ C K    | /TIM1BKIN | P F 1 0 / A D C 3 _ | I N 8 / F S M C _ I N T R | PIU1022  4 9 PF11 | T_CS    |     |     |     |     |     |     |
|     |     |     | SPI2_MISO | PB14 | PIU1074  7 5 P B 1 3 / | S P I 2 _ SC K / I 2 S 2 _ C K / U S A R T     | 3 _ C T S / T I M 1 _ C H 1 | N         | PF11/               | F S M C _ N IO S 1 6      | PIU1049  5 0 PF12 | FSMC_A6 |     |     |     |     |     |     |
B SPI2_MOSI PB15 PIU1075  7 6 P B 1 4 / S P I 2 _ M I S O / U S A R T 3 _ R T S / T IM 1 _ C H 2 N P F 1 2 /F S M C _ A 6 PIU1050  5 3 PF13 FSMC_A7 B
|     |     |     |           |             | PIU1076  P B 1 5 /         | S P I 2 _ M O S I / I 2 S 2 _ S D / T I M 1 _ | C H 3 N |     |                    | P F 1 3 / F S M C _ A 7   | PIU1053  5 4 PF14       | FSMC_A8           |     | LCD |               |          |     |     |
| --- | --- | --- | --------- | ----------- | -------------------------- | --------------------------------------------- | ------- | --- | ------------------ | ------------------------- | ----------------------- | ----------------- | --- | --- | ------------- | -------- | --- | --- |
|     |     |     | OV_D0     | PC0         | 2 6                        |                                               |         |     |                    | P F 1 4 / F S M C _ A 8   | PIU1054  5 5 PF15       | FSMC_A9           |     |     |               |          |     |     |
|     |     |     | OV_D1     | PC1         | PIU1026  2 7 P C 0 / A     | D C 1 2 3 _ I N 1 0                           |         |     |                    | P F 1 5 / F S M C _ A 9   | PIU1055                 |                   |     |     |               |          |     |     |
|     |     |     | OV_D2     | PC2         | PIU1027  2 8 P C 1 / A     | D C 1 2 3 _ I N 1 1                           |         |     |                    |                           | 5 6 PG0                 | FSMC_A10          |     |     |               |          |     |     |
|     |     |     |           |             | PIU1028  P C 2 / A         | D C 1 2 3 _ I N 1 2                           |         |     |                    | P G 0 / F S M C _ A 1 0   | PIU1056                 |                   |     |     |               |          |     |     |
|     |     |     | O V _ D 3 | P C 3       | PIU1029  2 9 P C 3 / A     | D C 1 2 3 _ I N 1 3                           |         |     |                    | P G 1 / F S M C _ A 1 1   | PIU1057  5 7 P G 1      | F S M C _ A 1 1   |     |     | 3 2 PIJP5032  | FSMC_NE4 |     |     |
|     |     |     | O V _ D 4 | P C 4       | PIU1044  4 4 P C 4 / A     | D C 1 2 _ I N 1 4                             |         |     |                    | P G 2 / F S M C _ A 1 2   | PIU1087  8 7 P G 2      | F S M C _ A 1 2   |     |     | 3 1 PIJP5031  | FSMC_A10 |     |     |
|     |     |     | O V _ D 5 | P C 5       | PIU1045  4 5 P C 5 / A     | D C 1 2 _ I N 1 5                             |         |     |                    | P G 3 / F S M C _ A 1 3   | PIU1088  8 8 P G 3      | F S M C _ A 1 3   |     |     | 3 0 PIJP5030  | FSMC_NWE |     |     |
|     |     |     | O V _ D 6 | P C 6       | PIU1096  9 6 P C 6 / I 2   | S 2 _ M C K / T I M 8 _ C H 1 / S D I O _     | D 6     |     |                    | P G 4 / F S M C _ A 1 4   | PIU1089  8 9 P G 4      | F S M C _ A 1 4   |     |     | 2 9 PIJP5029  | FSMC_NOE |     |     |
|     |     |     | O V _ D 7 | P C 7       | 9 7 P C 7 / I 2            | S 3 _ M C K / T I M 8 _ C H 2 / S D I O _     | D 7     |     |                    | P G 5 / F S M C _ A 1 5   | 9 0 P G 5               | F S M C _ A 1 5   |     |     | 2 8           | RESET    |     |     |
|     |     |     | S D I O _ | D 0 P C 8   | PIU1097  9 8 P C 8 / T     | I M 8 _ C H 3 / S D I O _ D 0                 |         |     |                    | P G 6 / F S M C _ I N T 2 | PIU1090  9 1 P G 6      |                   |     |     | 2 7 PIJP5028  | FSMC_D0  |     |     |
|     |     |     | S D I O _ | D 1 P C 9   | PIU1098  9 9 P C 9 / T     | I M 8 _ C H 4 / S D I O _ D 1                 |         |     |                    | P G 7 / F S M C _ I N T 3 | PIU1091  9 2 P G 7      |                   |     |     | 2 6 PIJP5027  | FSMC_D1  |     |     |
|     |     |     | S D I O _ | D 2 P C 1   | 0 1 PIU1099  1 1 P C 1 0 / | U A R T 4 _ T X / S D I O _ D 2               |         |     |                    | P G                       | 8 PIU1092  9 3 P G 8    |                   |     |     | 2 5 PIJP5026  | FSMC_D2  |     |     |
|     |     |     | S D I O _ | D 3 P C 1 1 | 1 PIU10111  1 2 P C 1 1 /  | U A R T 4 _ R X / S D I O _ D 3               |         |     | P G 9 / FS M C _ N | E 2 / F S M C _ N C E 3   | PIU1093  1 2 4 P G 9    | F S M C _ N E 2   |     |     | 2 4 PIJP5025  | FSMC_D3  |     |     |
|     |     |     | S D I O _ | S C K P C 1 | 2 1 PIU10112  1 3          |                                               |         |     |                    |                           | PIU10124  1 2 5 P G 1 0 | F S M C _ N E 3   |     |     | PIJP5024      | FSMC_D4  |     |     |
|     |     |     |           | P C 1       | 3 PIU10113  7 P C 1 2 /    | U A R T 5 _ T X / S D I O _ CK                |         | PG1 | 0 /F S M C _ N C E | 4 _ 1 / F S M C _ N E 3   | PIU10125  1 2 6 P G 1 1 |                   |     |     | 2 3 PIJP5023  | FSMC_D5  |     |     |
|     |     |     |           |             | PIU107  8 P C 1 3 -        | T A M P E R - R TC                            |         |     | P G 1              | 1 / F S M C _ N C E 4 _ 2 | PIU10126  1 2 7 P G 1 2 | F S M C _ N E 4   |     |     | 2 2 PIJP5022  | FSMC_D6  |     |     |
|     |     |     |           |             | PIU108  9 P C 1 4 -        | O S C 3 2 _ I N                               |         |     |                    | P G 1 2 / F S M C _ N E 4 | PIU10127  1 2 8 P G 1 3 | O V _ S D A       |     |     | 2 1 PIJP5021  | FSMC_D7  |     |     |
|     |     |     |           |             | PIU109  P C 1 5 -          | O S C 3 2 _ O U T                             |         |     |                    | P G 1 3 / F S M C _ A 2 4 | PIU10128  1 2 9 P G 1 4 | F I F O _ R R S T |     |     | 2 0 PIJP5020  | FSMC_D8  |     |     |
P I 02C  C O 4 C4 0   1 PIC402  F S M C _ D 2 P D 0 1 1 4 P G 1 4 / F S M C _ A 2 5 P I U 1 0 132 1 2 9   P G 1 5 F I F O _ O E 1 9 P I J P 5 0 1 9 FSMC_D9
P IX2 C410P F S M C _ D 3 P D 1 1 PIU10114  1 5 P D 0 / F S M C _ D 2 PG15 P I U 1 0 1 3 2   1 8 P I J P 5 0 1 8 FSMC_D10
COX2  X2 S D I O _ C M D P D 2 1 PIU10115  1 6 P D 1 / F S M C _ D 3 6 VBAT_IN 1 7 PIJP5017  FSMC_D11
PIX201  32.768KHz O V _ S C L P D 3 1 PIU10116  1 7 P D 2 / T IM 3 _ E T R / UART5_RX/SDIO_CMD VBAT PIU106  1 6 PIJP5016  FSMC_D12
F S M C _ N O E P D 4 1 PIU10117  1 8 P D 3 / F S M C _ C L K 23 1 5 PIJP5015  FSMC_D13
|     |     |     |     |     | P I U 1 0 1 1 8   P D 4 / F | S M C _ N O E |     |     |     | OSC_IN | PIU1023  |     |     |     | 1 4 P I J P 5 0 1 4 |     |     |     |
| --- | --- | --- | --- | --- | --------------------------- | ------------- | --- | --- | --- | ------ | -------- | --- | --- | --- | ------------------- | --- | --- | --- |
C P O I C5 C   501 PIC502  F S M C _ N W E P D 5 1 P 1 I U 9 1 0 1 1 9   P D 5 / F S M C _ N W E COX1  X 1 1 3 P I J P 5 0 1 3 FSMC_D14
C510P FI F O _ W R S T P D 6 1 PIU10122  2 2 P D 6 / F S M C _ N W A IT OSC_OUT PIU1024  24 PIX101 PIX102  1 2 PIJP5012  FSMC_D15
|     |     |     |     | P D 7 | 1 PIU10123  2 3 P D 7 / F | S M C _ N E1 /F SMC_NCE2 |     |     |     |     |     |     | 8M Hz |     | 1 1 PIJP5011  | LCD_BL |     |     |
| --- | --- | --- | --- | ----- | ------------------------- | ------------------------ | --- | --- | --- | --- | --- | --- | ----- | --- | ------------- | ------ | --- | --- |
SWD F S M C _ D 1 3 P D 8 7 7 P D 8 / F S M C _ D 1 3 NRST 25 R E S E T C R21M O R 2   1 0 V C C 3 . 3 V C C 5 V C C3 .3
C GND F S M C _ D 1 4 P D 9 P 7 I U 8 1 0 7 7   P D 9 / F S M C _ D 1 4 PIU1025  PIC602 P I R 2 0 1  PIR202P IC702  9 PI J P 5 0 1 0   C
F S M C _ D 1 5 P D 1 0 P 7 I U 9 1 0 7 8   P D 1 0 / F S M C _ D 1 5 Vref+ 32 V R E F + C C6 O C 6   COC7  C7 8 P I J P 5 0 9   G N D PIC2802  PIC2902
VCC3.3 F S M C _ A 1 6 P D 1 1 P 8 I U 0 1 0 7 9   P D 1 1 / F S M C _ A 1 6 PIU1032  PIC601  22P PIC701  22P 7 P I J P 5 0 8   PIC2801 COC28  C 2 8 PIC2901 COC29  C 2 9
1 F S M C _ A 1 7 P D 1 2 P 8 I U 1 1 0 8 0   P D 1 2 / F S M C _ A 1 7 Vref- 31 GND 6 P I J P 5 0 7   V C C 5
PIJP601  SWDIO F S M C _ A 1 8 P D 1 3 PIU1081  8 2 PIU1031  V D D A COR3  PIJP506  T_MISO 10 4 1 0 4
2 PIJP602  SWDCLK F S M C _ D 0 P D 1 4 PIU1082  8 5 P D 1 3 / F S M C _ A 1 8 33 R 3 5 PIJP505  T _ M O SI
3 PIJP603  F S M C _ D 1 P D 1 5 PIU1085  8 6 P D 1 4 / F S M C _ D 0 VDDA PIU1033  PIC1002  PIC1102 PIR301  1 0 R PIR302  VCC3 . 3 GND 4 PIJP504  T _ PE N
4 PIJP604  PIU1086  P D 1 5 / F S M C _ D 1 SSV SSV SSV SSV SSV SSV SSV SSV SSV SSV SSV DDV DDV DDV DDV DDV DDV DDV DDV DDV DDV DDV 30 PIC1001 COC10  C 1 0 PIC1101 COC11  C 1 1 3 P I J P 5 0 3 T_CS   G N D G N D
COJP6  JP6 BOOT0 138 VSSA PIU1030  10 U F 10 4 2 P I J P 5 0 2 T_SCK
GND PIU10138  BOOT0 PIU1016 PIU1038  PIU1051 PIU1061 PIU1071 PIU1083 PIU1094 PIU10107 PIU10120 PIU10130 PIU10143  PIU1017  PIU1052 PIU1039 PIU1062 PIU1072 PIU1084 PIU1095 PIU10108  PIU10121 PIU10131 PIU10144  1 PIJP501
|     |     |     |     |     |     | 61 83 15 16 17 38 49 | 701 021 031 341 71 | 25 93 26 27 48 | 59 801 121 131 441 |     |     |     |     |     | COJP5  JP5 |     |     |     |
| --- | --- | --- | --- | --- | --- | -------------------- | ------------------ | -------------- | ------------------ | --- | --- | --- | --- | --- | ---------- | --- | --- | --- |
GND
STM32F103ZET6
VCC3.3M
|     |     | VCC3.3 VCC3.3M |     |     |     | GND |     |     |     |     |     |     |     |     |     |     |     |     |
| --- | --- | -------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
USB_TTL/USART1
|     |     |     |     |     |     | VREF+ |     | VBAT |     |     |     | RESET |     |     |     |     |     |     |
| --- | --- | --- | --- | --- | --- | ----- | --- | ---- | --- | --- | --- | ----- | --- | --- | --- | --- | --- | --- |
VCC3.3
|      |     |     | VCC3.3M |     |     |     |     |     |       |                 |     |     | PIR402  |     |     |     |     |     |
| ---- | --- | --- | ------- | --- | --- | --- | --- | --- | ----- | --------------- | --- | --- | ------- | --- | --- | --- | --- | --- |
| BOOT |     |     |         |     |     |     |     |     | COQ3  | VCC3.3M VBAT_IN |     |     |         |     |     |     |     |     |
PIC1302  PIC1402  PIC1502  PIC1602  PIC1702  PIC1802  PIC1902  PIC2002  PIC2102  PIC2202  PIC2302  PIC2402  VREF+ VBAT 2 Q3 1 COR4  R4 P A 10 U S A R T 1 _ R X T X D
PIC1301 COC13P IC1401 COC14P IC1501 COC15P IC1601 COC16P IC1701 COC17P IC1801 COC18P IC1901 COC19P IC2001 COC20P IC2101 COC21P IC2201 COC22P IC2301 COC23P IC2401 COC24  C R O R11  1 1 PIQ302 P I Q 3 0 3   P I Q 301  10KSW1 C O S W 1   P I J P 3 0 1   1 2 P I J P 3 0 2
C13 C14 C15 C16 C17 C18 C19 C20 C21 C22 C23 C24 VREF PIR11 01   PIR110 P I C 22 6 0 2    P I C 2 7 0 2   3 RESET PIR401  P A 9 U S A R T 1 _ TX P I J P 3 0 3   3 4 P I J P 3 0 4 R   X D
104 104 104 104 104 104 104 104 104 104 104 104 10 R BAT54C P I C 2 5 0 2   C C12 POI CS 1W2 1   0 1   P I S W 1 0 2  P I J P 3 0 5   5 6 P I J P 3 0 6 V   C C 3.3
CO R1310K R 1 3   BOOT1 P I C 2 6 0 1   COC26  C26 P I C 2 7 0 1   COC27  C27 P I C 1 2 0 1   P I C 1 2 0 2   P I J P 3 0 7   7 8 P I J P 3 0 8 V   C C 5
P IR 1 3 02  PIR1301  10UF 104 P I C 2 5 0 1   C25 C OC 25   104 P I J P 3 0 9   9 10 PI J P 3 0 1 0 V   C C 5
|     |                     |     | GND |     |     |     |     |     |     | 104 |     |     |     |     |     |            |     |     |
| --- | ------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---------- | --- | --- |
| D   | COR12  R1210K BOOT0 |     |     |     |     |     |     |     |     |     |     |     |     |     |     | COJP3  JP3 |     | D   |
|     | PIR1202  PIR1201    |     |     |     |     |     |     |     |     |     |     |     | GND |     |     | GND        |     |     |
|     |                     |     |     |     |     | GND |     |     |     | GND |     |     |     |     |     |            |     |     |
GND
Title:CORE.SchDoc
Project:STM32F103_CORE_BOARD.PrjPCB
|     |     |     |     |     |     |     |     |     |     |     |     |     |     | Size:A3       | Author:  | ATOM@ALIENTEK |       |     |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ------------- | -------- | ------------- | ----- | --- |
|     |     |     |     |     |     |     |     |     |     |     |     |     |     | Date:2023/8/7 | Version: | V1.6 Sheet:   | 1 of3 |     |
|     | 1   | 2   | 3   |     |     | 4   |     |     | 5   |     |     | 6   |     | 7             |          |               | 8     |     |

|       | 1   |     |     |     | 2   |     |     |     |     |     | 3   |     |     |     | 4   |
| ----- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FLASH |     |     |     |     | LED |     |     |     |     |     |     |     |     |     |     |
KEY
VCC3.3
|     |     |       |     |     |     |     | CROR1144  | CLOLEEDD0 0 |      |     |     |        |           |     |     |
| --- | --- | ----- | --- | --- | --- | --- | --------- | ----------- | ---- | --- | --- | ------ | --------- | --- | --- |
|     | CU  | OU33  |     |     |     |     |           |             | LED0 |     |     | VCC3.3 | K E Y _ U | P   |     |
V C C 3 .3 C C O C 3 3 00   P I R 1 4 0 2   P I R 1 4 0 1   P I L E D 0 0 1   P I L E D 0 0 2   W K _ UP
| F _C S | 1   |     | 8   |     |     |     | 5 1 0 R |     | 红 色 |     |     |     | P I S W 2 0 1   P I S W 2 | 0 2   |     |
| ------ | --- | --- | --- | --- | --- | --- | ------- | --- | --- | --- | --- | --- | ------------------------- | ----- | --- |
A P I U 3 0 1   C S V C C P I U 3 0 8   P IC 30 0 1   P I C 3 002  GND C R O R 115 5  K C O S E W 2  Y 0 A
S P I2 _MISO 2 D O HO L D 7 1C 0 4 CLOLEEDD1 1 L ED1 K E Y 0 BOOT0
P I U 3 3 0 2   P I U 6 3 0 7 S  P I 2 _ S K P I R 1 5 0 2   P I R 1 5 0 1   P I L E D 1 0 1   P I L E D 1 0 2   P I S W 3 0 1   P I S W 3 0 2
| VCC3.3 | PIU4303 WP | CLK | PIU5306S PI2_MOSI |     |     |     | 510R      |     | 绿色  |     |     |     | COSW3  |     |     |
| ------ | ---------- | --- | ----------------- | --- | --- | --- | --------- | --- | --- | --- | --- | --- | ------ | --- | --- |
|        | PIU304 GND |     | DIPIU305          |     |     |     | CROR1166  |     |     |     |     |     |        |     |     |
CPOPWWR R
|     | W25Q128 |     |     |     |     |     | PIR1602  PIR1601  | PIPWR01  | PIPWR02  | GND |     |     |     |     |     |
| --- | ------- | --- | --- | --- | --- | --- | ----------------- | -------- | -------- | --- | --- | --- | --- | --- | --- |
|     |         |     |     |     |     |     | 1K                |          | 蓝色       |     |     |     |     |     |     |
GND
SD CARD
| EEPROM |     |       |      |     |     |            |                   |                 |                               |        |     | M3过孔 |     |     |     |
| ------ | --- | ----- | ---- | --- | --- | ---------- | ----------------- | --------------- | ----------------------------- | ------ | --- | ---- | --- | --- | --- |
|        |     |       |      |     |     | CJO1J1     |                   |                 |                               | VCC3.3 |     |      |     |     |     |
|        |     |       |      |     |     |            | 1 SDIO_D2         | CROR1177        |                               |        |     |      |     |     |     |
|        |     | V C C | 3 .3 |     |     | D A T      | A 2 P I J 1 0 1   | C O R P 1 I 8 R |   1 7 0 1   4 7 K P I R 1 7 0 | 2      |     |      |     |     |     |
|        |     |       |      |     |     | CD/D A T A | 3 2 S D I O _ D   | 3 R 1 8         | 4 7 K                         |        |     |      |     |     |     |
P I R 2 2 0 2   P I R 2 3 0 2   P I J 3 1 0 2 S   D I O _ C M D C R O R P 1 1 I 9 R 9   1 8 0 1   P I R 1 8 0 2   P I C 3 1 0 2   C O H O L E 1   C O H O L E 2
B CUO U44   P I C 3 2 0 2   C M D P I J 4 1 0 3   P I R 1 9 0 1   4 7 K P I R 1 9 0 2   H O L E 1 H O L E 2 B
| 1               |         | 8             | CR OR 22 22  CR OR | 22 33   CC OC 33 22  |     | V   | D D P I J 1 0 4     |     |     | CC OC 33 11     |     |     |     |     |     |
| --------------- | ------- | ------------- | ------------------ | -------------------- | --- | --- | ------------------- | --- | --- | --------------- | --- | --- | --- | --- | --- |
| P I U 4 0 1   A | 0 V C C | P I U 4 0 8   |                    | 1 0 4                |     |     | 5 S D I O _ S       | C K |     | P I C 3 1 0 1   |     |     |     |     |     |
| 2 A             | 1 W P   | 7             | 4 . 7 K 4 .        | 7 K P I C 3 2 0 1    |     | C   | L K P I J 6 1 0 5   |     |     | 1 0 4           |     |     |     |     |     |
P I U 3 4 0 2   P I U 6 4 0 7 I   I C _ S C L P I R 2 2 0 1   P I R 2 3 0 1   V S S P I J 1 0 6   C O R 2 0   M 3 M 3
| P I U 4 0 3   A | 2 S C L  | P I U 4 0 6   |       |     |     | D A T | A 0 7 S D I O _ D           | 0 R 2 0                 | 4 7 K                   |     |     |     |     |     |     |
| --------------- | -------- | ------------- | ----- | --- | --- | ----- | --------------------------- | ----------------------- | ----------------------- | --- | --- | --- | --- | --- | --- |
| 4 G             | ND S D A | 5 I I C _     | S D A |     |     |       | P I J 8 1 0 7 S   D I O _ D | 1 C R O R P 2 2 I 1 R 1 |   2 0 0 1   P I R 2 0 0 | 2   |     |     |     |     |     |
P I U 4 0 4   P I U 4 0 5   D A T A 1 P I J 1 0 8   P I R 2 1 0 1   4 7 K P I R 2 1 0 2   C O H O L E 3   C O H O L E 4
|       |     |     |     |     |     |     | K 9       |     |     |     |     |     | H O | L E 3 H O L E | 4   |
| ----- | --- | --- | --- | --- | --- | --- | --------- | --- | --- | --- | --- | --- | --- | ------------- | --- |
| 24C02 |     |     |     |     |     |     | PIJ11009  |     |     |     |     |     |     |               |     |
GND PIJ1010
|     |     |     |     |     |     |         |     |     |     |     |     |     | M3  | M3  |     |
| --- | --- | --- | --- | --- | --- | ------- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GND |     | GND |     |     |     | TF_Card |     |     |     |     |     |     |     |     |     |
GND
C C
D D
Title: DEVICE.SchDoc
Project:STM32F103_CORE_BOARD.PrjPCB
|     |     |     |     |     |     |     |     |     |     |     |     |     | Size:A4        | Author: ATOM@ALIENTEK |               |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | -------------- | --------------------- | ------------- |
|     |     |     |     |     |     |     |     |     |     |     |     |     | Date: 2023/8/7 | Version: V1.6         | Sheet: 2 of 3 |
|     | 1   |     |     |     | 2   |     |     |     |     |     | 3   |     |                |                       | 4             |

|     |     |     | 1   |     |     |     |     |     | 2   |     |     | 3   |     |     | 4   |     |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
USB_5V
CUOUSSBB2 2
|     | 3.3V POWER |     |     |     |     |     |     |     |     |     | USB SLAVE |     | 2   |     |     |     |
| --- | ---------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --------- | --- | --- | --- | --- | --- |
PIU1S1B202 VBUS(A4+B9)
PIUSB2011 VBUS(B4+A9)
PI1US0B204 CC1(A5) 4
| A   |     |     |     |     |     |     |     |     |     |     |     |     | PIUSB2010 CC2(B5) |     |     | A   |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ----------------- | --- | --- | --- |
9
|     |     | USB_5V | VCC5    |     |                       |     | VCC3.3 |     |     |     |     | CROR55          | PIUS 3B209 SBU1(A8) |     |     |     |
| --- | --- | ------ | ------- | --- | --------------------- | --- | ------ | --- | --- | --- | --- | --------------- | ------------------- | --- | --- | --- |
|     |     |        |         |     |                       |     |        |     |     |     |     | VCC3.3          | PIUSB203 SBU2(B8)   |     |     |     |
|     |     |        | CFOF11  |     | VCOV11  CJ A1117B-3V3 |     |        |     |     |     |     | PIR501  PIR502  |                     |     |     |     |
|     |     |        |         |     |                       |     |        |     |     |     |     | 1.5K            | 6                   |     |     |     |
P I C 3 3 0 2   PP I C 3 4 0 2  I 3 Vin Vout 2 P I C 3 5 0 2   P I C 3 6 0 2   U S B _ D + C R28 O R 2 8   P I U S 8 B 2 0 6   D + 1 ( A 6 )
PIF10 1   P I F102  V 1 0 3  PIV 102  P I R 2 8 0 1 10R   P IC RO 2R 82 06 2    P I U S7 B 2 0 8   D + 2 ( B 6 )
F U SE  1 A CCOC3333  C CO C33 44  GN D CCOC3355  CCOC3366  U S B _ D - 10R R26 D - 1 ( A 7 )
P I C 3 3 0 1   P I C 3 4 0 1   PIV101   P I C 3 5 0 1   P I C 3 6 0 1   P I R 2 6 0 1   P I R 2 6 0 2   P I U S 5 B 2 0 7
|     |     |     |     | 22UF | 104 |     | 104 | 22UF |     |     |     |     | PIUSB205 D-2(B7) |     |     |     |
| --- | --- | --- | --- | ---- | --- | --- | --- | ---- | --- | --- | --- | --- | ---------------- | --- | --- | --- |
1
1
PI1US2B201 GND(A1+B12)
PIUSB2012 GND(B1+A12)
|     |     |     |     |     | GND |     |     |     |     |     |     |     | SPIHUSB220SH1 Shield1 SH1 |     |     |     |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ------------------------- | --- | --- | --- |
SPIHUSB320SH2 Shield2
SPIHUSB420SH3 Shield3
PIUSB20SH4 Sh U ie S ld B 4  TYPE-C
USB_OTG
GND
| B   |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     | B   |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
USB_5V
|     | USB USART |     |     |     |     |     |     |     |     |     |     | CUOUSSBB1 1 |     |     |     |     |
| --- | --------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ----------- | --- | --- | --- | --- |
VCC3.3
|     |     |          |            |     |         |     |     |     |     |     |     | 2  V B U S ( A 4 + B               | 9)  |     |     |     |
| --- | --- | -------- | ---------- | --- | ------- | --- | --- | --- | --- | --- | --- | ---------------------------------- | --- | --- | --- | --- |
|     |     |          | PIR2402    |     |         |     |     |     |     |     |     | P I U1 S1 B 1 0 2                  |     |     |     |     |
|     |     |          |            |     |         |     |     |     |     |     |     | PI U S B 1 0 1 1  V B U S ( B4 + A | 9 ) |     |     |     |
|     |     |          | COR24  R24 |     | C3V7CC5 |     |     |     |     |     |     |                                    |     |     |     |     |
|     |     |          |            |     | COC37   |     |     |     |     |     |     | 4                                  |     |     |     |     |
|     |     | COD2  D2 | 10K        |     |         |     |     |     |     |     |     | P I 1U S0 B 1 0 4  C C 1 ( A 5 )   |     |     |     |     |
RESET PIR2401  PIC370 1  P I C 3702  COU5  U5 P I U S B 1 0 1 0  C C 2 ( B5 )
|     |        | PID201 PID202  |         |                    | C 1C03U8F O C 38   |             |           |             |       |     |         | 9                                         |     |     |     |     |
| --- | ------ | -------------- | ------- | ------------------ | ------------------ | ----------- | --------- | ----------- | ----- | --- | ------- | ----------------------------------------- | --- | --- | --- | --- |
|     |        |                |         | GND                |                    | 16          | Vcc       | GND 1       |       | GND |         | PIUS3B109 SBU1(A8)                        |     |     |     |     |
|     |        | 1N4148         |         |                    | PIC3801 PIC3802    | PIU5016  15 |           | PIU501  2   | TXD   |     |         |                                           |     |     |     |     |
|     |        |                | PIQ103  | COQ1  Q1           | 104                | PIU5015     | RS232     | TxD PIU502  |       |     |         | PIUSB103 SBU2(B8)                         |     |     |     |     |
|     | VCC3.3 |                |         | SSR820550 C O R25  |                    | 14          | RTS#      | RxD 3       | RXD   |     |         | 6                                         |     |     |     |     |
|     |        |                |         |                    |                    | P I 13 U    | 5 0 1 4   | P I U 4 5   | 0 3   |     | C H 3 4 | 0 _ D + P I U S 8 B 1 0 6   D + 1 ( A 6 ) |     |     |     |     |
PIQ202  C Q2 OQ 2   PIQ10P1I R250 1   PIR2502  P I 12 U 5 0 1 3   DTR# V3 P I U 5 5 0 4   CH340_D+ D + 2 ( B 6 )
|     |     | SS85R5027 C O R27  | PIQ102  | 1K  |     |          | DCD#      | UD+       |                |     | C H 3 4 | 0 _ D - P I U S 7 B 1 0 8        |     |     |     |     |
| --- | --- | ------------------ | ------- | --- | --- | -------- | --------- | --------- | -------------- | --- | ------- | -------------------------------- | --- | --- | --- | --- |
|     |     |                    |         |     |     | P I U 11 | 5 0 1 2   | P I U 6 5 | 0 5   CH340_D- |     |         | P I U S5 B 1 0 7   D - 1 ( A 7 ) |     |     |     |     |
PIQ201   P I R270 1   PIR2702  P I 10 U 5 0 1 1   RI# UD- P I U 7 5 0 6   P I U S B 1 0 5   D - 2 ( B 7 )
| C   |     | PIQ203  1K |     |     |     | PIU5010  | DSR#   | XI PIU507  |     |                 |     |     |     |     |     | C   |
| --- | --- | ---------- | --- | --- | --- | -------- | ------ | ---------- | --- | --------------- | --- | --- | --- | --- | --- | --- |
|     |     |            |     |     |     |          | 9 CTS# | XO 8       |     | P I C 4 0 0 2   |     | 1   |     |     |     |     |
PIR3002  PIU509  PIU508  P I 1U S2 B 1 0 1  G N D ( A 1 + B 12 )
|     |     | COR30    |     |     |     |     |        |     |     | COC40               |     | G N D ( B1 + A 1      | 2 ) |     |     |     |
| --- | --- | -------- | --- | --- | --- | --- | ------ | --- | --- | ------------------- | --- | --------------------- | --- | --- | --- | --- |
|     |     | R30      |     |     |     |     | CH340C |     |     | P I C 4 0 0 1   C40 |     | P I U S B 1 0 1 2     |     |     |     |     |
|     |     | 1K       |     |     |     |     |        |     |     | 104                 |     | SH1                   |     |     |     |     |
|     |     | PIR3001  |     |     |     |     |        |     |     |                     |     | SPIHUS2B10SH1 Shield1 |     |     |     |     |
|     |     | BOOT0    |     |     |     |     |        |     |     |                     |     | SPIHUSB310SH2 Shield2 |     |     |     |     |
SPIHUS4B10SH3 Shield3
GND
PIUSB10SH4 Sh ie ld 4
U S B  TYPE-C
USB_TTL
GND
| D   |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     | D   |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
Title: POWER&USB_USART.SchDoc
Project:STM32F103_CORE_BOARD.PrjPCB
|     |     |     |     |     |     |     |     |     |     |     |     |     | Size:A4        | Author: ATOM@ALIENTEK |               |     |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | -------------- | --------------------- | ------------- | --- |
|     |     |     |     |     |     |     |     |     |     |     |     |     | Date: 2023/8/7 | Version: V1.6         | Sheet: 3 of 3 |     |
|     |     |     | 1   |     |     |     |     |     | 2   |     |     | 3   |                |                       | 4             |     |

| COHOLE2    |     |     |     |     |     |     |     |     |     |     |     | COHOLE1    |
| ---------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---------- |
| PAHOLE200  |     |     |     |     |     |     |     |     |     |     |     | PAHOLE100  |
PAJP202  PAJP204  PAJP206  PAJP208  PAJP2010  PAJP2012  PAJP2014  PAJP2016  PAJP2018  PAJP2020  PAJP2022  PAJP2024  PAJP2026  PAJP2028  PAJP2030  PAJP2032  PAJP2034  PAJP2036  PAJP2038  PAJP2040  PAJP2042  PAJP2044  PAJP2046  PAJP2048  PAJP2050
COJP2
PAJP201  PAJP203  PAJP205  PAJP207  PAJP209  PAJP2011  PAJP2013  PAJP2015  PAJP2017  PAJP2019  PAJP2021  PAJP2023  PAJP2025  PAJP2027  PAJP2029  PAJP2031  PAJP2033  PAJP2035  PAJP2037  PAJP2039  PAJP2041  PAJP2043  PAJP2045  PAJP2047  PAJP2049
COC33
| C O U SB1  | COF1  | PAU508  PAU507  | PAU506  PAU505  PAU504  | PAU503  PAU502  PAU501  |     |     |     |     |     |     |     |     |
| ---------- | ----- | --------------- | ----------------------- | ----------------------- | --- | --- | --- | --- | --- | --- | --- | --- |
PAUS B1 0SH 2  PAUSB10SH1  PAC3301  PAC3302  COC40 PAQ302  PAQ301  COU3  COU4
PAC4002
|     |     |     |     |     | COQ3  | COC23  | COC22  |     |     |     |     |     |
| --- | --- | --- | --- | --- | ----- | ------ | ------ | --- | --- | --- | --- | --- |
PAUSB10  P A U S B 1 0 1   PAF101  PAF102  PAC4001  COR23 PAR2302 PAR2301  PAU405  PAU404
P A U S B 1 0 2   COU5  PAQ303  PAU301  PAU308 PAC3001 PAC3002 COC30
|     |                                     |                         |     | COC38 COC37  |                                 |                 |                 |               |               | C O R 2 2   | P A R 2 2 0 2   P A R 2 2 0 1   P A U 4 0 6   | P A U 4 0 3   |
| --- | ----------------------------------- | ----------------------- | --- | ------------ | ------------------------------- | --------------- | --------------- | ------------- | ------------- | ----------- | --------------------------------------------- | ------------- |
|     | P A U S B 1 0 3                     |                         |     |              | COC25 COC14                     |                 |                 | P A U 3 0 2   | P A U 3 0 7   |             |                                               |               |
|     | P P A A U U S S B B 1 1 0 0 5 4     | PAC34 01 PAC3402 COC34  |     |              | P A C 2 5 0 1   P A C 1 4 0 1   | P A C 2 3 0 1   | P A C 2 2 0 1   |               |               |             |                                               |               |
P A U S B 1 0 6   COV1   PAU509  PAU5010  PAU5011  PAU5012  PAU5013  PAU5014  PAU5015  PAU5016  P A U 3 0 3   P A U 3 0 6   C O C 3 2   P A U 4 0 7   P A U 4 0 2
P A U S B 1 0 7   P A C 2 5 0 2   P A C 1 4 0 2   P A C 2 3 0 2   P A C 2 2 0 2   P A C 3 2 0 2   P A C 3 2 0 1
|             | P A U S B 1 0 8                         |                 |                                           |                                 |                                                                                                                                                                                                                                                                                                                                      |     |     | PAU304  | PAU305  |     | PAU408  | PAU4 01   |
| ----------- | --------------------------------------- | --------------- | ----------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | --- | ------- | ------- | --- | ------- | --------- |
|             | P A U S B 1 0 9                         |                 |                                           |                                 | COU1                                                                                                                                                                                                                                                                                                                                 |     |     |         |         |     |         |           |
|             | P P A A U U S S B B 1 1 0 0 1 1 1 0     | PAQ102          | PAQ101  P A R 2 5 0 1   P A R 2 5 0 2   C | O R 2 5                         | PAU10144P AU10143P AU10142P AU10141P AU10140P AU10139 PAU10138 PAU10137P AU10136 PAU10135P AU10134P AU10133 PAU10132P AU10131P AU10130 PAU10129P AU10128P AU10127 PAU10126P AU10125P AU10124 PAU10123P AU10122P AU10121 PAU10120P AU10119P AU10118 PAU10117P AU10116P AU10115P AU10114P AU10113 PAU10112 PAU10111P AU10110 PAU10109  |     |     |         |         |     |         |           |
|             |                                         | PAV102          |                                           | P A C 3 8 0 2   P A C 3 7 0 2   |                                                                                                                                                                                                                                                                                                                                      |     |     |         |         |     |         | C O JP5   |
|             | P A U S B 1 0 1 2                       |                 | C                                         | O R 2 7                         |                                                                                                                                                                                                                                                                                                                                      |     |     |         |         |     |         |           |
| PAUSB10SH4  | PAUSB1 0 S H 3                          | PAV101  PAV103  | P A R 2 7 0 1   P A R 2 7 0 2             | P A C 3 8 0 1   P A C 3 7 0 1   |                                                                                                                                                                                                                                                                                                                                      |     |     |         |         |     |         |           |
PAQ103 COQ1 PAR3002 PAR3001 COR30
PAJ109
COR1 6   P AR1 602   P AR 16 01 C O P W R   P AP W R 0 1   P APWR02  PAC3 6 0 1   P A C 360 2  C O C 3 6 PAQ202  PAQ201  PA R240 1  PAR24 02 COR24   P A U 1 0 1   P A U 1 0 1 0 8   C O R 2 1
C O U S B 2   P A U 1 0 2   P A U 1 0 1 0 7   PA C2402  PA C2401   P A R 2 1 0 2   P A R 2 1 0 1   P A J 1 0 8
PA US B 2 0 S H 2   P AU S B 2 0 S H 1   P A U 1 0 3   P A U 1 0 1 0 6   C O C 2 4   C O R 2 0   P A J P 5 0 3 2
P A C 3 5 0 1   P A C 3 5 0 2   C O C 3 5   P AC 50 2  PA C50 1  P A U 1 0 4   P A U 1 0 1 0 5   P A R 2 0 0 2   P A R 2 0 0 1   P A J 1 0 7   P A J P 5 0 3 1
PAQ203  C O Q 2   P A U 1 0 5   P A U 1 0 1 0 4   P A J 1 0 6   COC2 COR6  P P A A J J P P 5 5 0 0 2 3 9 0
PA U SB2 0   P A U S B 2 01   P A R 2 6 0 2   P AC R 2 6 0 1  O J C P O 3 R 2   6   P A X 2 0 1   P P A A U U 1 1 0 0 6 7     P P A A U U 1 1 0 0 1 1 0 0 3 2     PA C 20 2   PA C2 0 1   PAR 6 0 1   PAR602  PAR1 02  PAR 101   COR1  P A J P 5 0 2 8
P A U S B 2 0 2   C O R 28   PA D 20 1  PAD202 COD2  P A U 1 0 8   P A U 1 0 1 0 1   P A J 1 0 5   P A J P 5 0 2 7
PA R 28 0 2   PAR2801  P A U 1 0 9   P A U 1 0 1 0 0   PACU2 01O4 P ACU20 133 PA 1U201  2 PAP UA C 23 01 10 11    PAUP 2A 0C 13 01  0 2 P  P A J P 5 0 2 6
P A U S B 2 0 3   P A R 5 0 2   P A U 1 0 1 0   P A U 1 0 9 9   PAU2022 PAU2021 PAU2020 PAU2019 PAU2018 PAU2017 PAU2016 PAU2015  AU209 PAU2 P 08  A PA J U20 1 7 P 0 AU2 4 06    PAU205 PAU204 PAU203 PAU202 PAU201  P A J P 5 0 2 5
P A U S B 2 0 4   PAJ P3 01 0  P AJP3 0 9   P A U 1 0 1 1   P A U 1 0 9 8   COJ P 1 A J   P 5 0 2 4
P P A A U U S S B B 2 2 0 0 6 5     P A R 5 0 1   PAX202  P A U 1 0 1 2   P A U 1 0 9 7   C O R 1 9   P A R 1 9 0 2   P A R 1 9 0 1   P A J 1 0 3   P A J P 5 0 2 3
P A U S B 2 0 7   P P A A U U 1 1 0 0 1 1 3 4     P P A A U U 1 1 0 0 9 9 6 5     PA C2002  PA C2001   P P A A J J P P 5 5 0 0 2 2 1 2
P A U S B 2 0 8   C O R 5  P A U 1 0 1 5   P A U 1 0 9 4   CO R 1 8   PAR 1802  P A R 1 8 0 1  P A J 1 0 2   P A J P 5 0 2 0
P A U S B 2 0 9   P A J P 3 0 8   P A J P 3 0 7   P A C 4 0 2   P A C 4 0 1   P A U 1 0 1 6   P A U 1 0 9 3   C O C 2 0   P A J P 5 0 1 9
P A U S B 2 0 1 0   P A U 1 0 1 7   P A U 1 0 9 2   C O R 1 7   PA R 1 7 0 2   PAR1701 P A J 1 0 1   P A J P 5 0 1 8
P A U S B 2 0 1 1   PA C 1 3 0 1   PA C 1 3 0 2   P A U 1 0 1 8   P A U 1 0 9 1   P A J P 5 0 1 7   PAJ100
C O S W 3   P A U S B 2 0 1 2   P A U 1 0 1 9   P A U 1 0 9 0   P P A A J J P P 5 5 0 0 1 1 5 6
| PA US B2 0S H4   | PAU SB 2 0 S H 3   |     |     | C O C 5   P A U 1 | 0 2 0   |     |     | P A U 1 0 8 9   |     |     |     |     |
| ---------------- | ------------------ | --- | --- | ----------------- | ------- | --- | --- | --------------- | --- | --- | --- | --- |
C O J P 6   P A J P 3 0 6   P A J P 3 0 5   P P A A U U 1 1 0 0 2 2 2 1     P P A A U U 1 1 0 0 8 8 8 7     P P A A J J P P 5 5 0 0 1 1 3 4
|     |     |           |     | C O X 2   P A U 1 | 0 2 3   |     |     | P A U 1 0 8 6   |     |     |     | P A J P 5 0 1 2   |
| --- | --- | --------- | --- | ----------------- | ------- | --- | --- | --------------- | --- | --- | --- | ----------------- |
|     |     | CO R 12   |     | P A U 1           | 0 2 4   |     |     | P A U 1 0 8 5   |     |     |     | P A J P 5 0 1 1   |
PASW302  C O C 4   P A U 1 0 2 5   P A U 1 0 8 4   PAC 2102  PA C2101   P A C 2 9 0 2   PA J P 5 0 1 0
PAJP304  PAJP303  P A U 1 0 2 6   P A U 1 0 8 3   P A J PP 5 A 0 J9   1010
PAJP604  C O C 1 3  P A U 1 0 2 7   P A U 1 0 8 2   C O C 2 1   PAC2801  P A C 2 9 0 1   P A J P 5 0 8
PAR1202  P A U 1 0 2 8   P A U 1 0 8 1   COU2  P P A A J J P P 5 5 0 0 6 7
PASW301  P P A A U U 1 1 0 0 3 2 0 9     P P A A U U 1 1 0 0 8 7 0 9     PAC2802 COC29  P A J P 5 0 5
PAR1201  PAC1501 PAC1502  P A U 1 0 3 1   P A U 1 0 7 8   COC28  P A J P 5 0 4
COSW2  PAJP302  PAJP301  P A U 1 0 3 2   P A U 1 0 7 7   P A J P 5 0 3
PAJP603  COC15  P A U 1 0 3 3   P A U 1 0 7 6   PAU2023 PAU2024 PAU2025 PAU2026 PAU2027 PAU2028 PAU2029 PAU2030 PAU2031 PAU2032 PAU2033 PAU2034 PAU2035 PAU2036 PAU2037 PAU2038 PAU2039 PAU2040 PAU2041 PAU2042 PAU2043 PAU2044  P A J P 5 0 2
|     |     |     |     | P A U 1  | 0 3 4   |     |     | P A U 1 0 7 5   |     |     |     | P A J P 5 0 1   |
| --- | --- | --- | --- | -------- | ------- | --- | --- | --------------- | --- | --- | --- | --------------- |
|     |     |     |     | PAU1035  |         |     |     | PAU1074         |     |     |     |                 |
PAC2601  PAC2602 PAC1002  PAC1001  PAU1036  PAU1073  PAJP500
|     | PASW202 PAJP602  | COX1    |                                         |     |                                                                                                                                                                                                                                                                                                  |     |     |     |                                         |     |     |     |
| --- | ---------------- | ------- | --------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | --- | --- | --------------------------------------- | --- | --- | --- |
|     |                  |         |                                         |     | PAU1037P AU1038 PAU1039 PAU1040P AU1041 PAU1042 PAU1043 PAU1044 PAU1045 PAU1046 PAU1047 PAU1048 PAU1049 PAU1050 PAU1051 PAU1052 PAU1053 PAU1054 PAU1055 PAU1056 PAU1057 PAU1058 PAU1059 PAU1060 PAU1061 PAU1062 PAU1063 PAU1064 PAU1065 PAU1066P AU1067 PAU1068 PAU1069 PAU1070 PAU1071 PAU1072  |     |     |     | COR7 PAR702 PAR701  PAC101 PAC102 COC1  |     |     |     |
|     |                  | PAX102  | PAX101 PAC2701 PAC2702 PAC1102 PAC1101  |     |                                                                                                                                                                                                                                                                                                  |     |     |     |                                         |     |     |     |
PAR1101 PAR1102 PAR301 PAR302
PASW201 PAJP601
|          |                                            |                                            | COC26 COC10             |       |                 |                 |                 | PAC1902 PAC1901  |     |     |     |     |
| -------- | ------------------------------------------ | ------------------------------------------ | ----------------------- | ----- | --------------- | --------------- | --------------- | ---------------- | --- | --- | --- | --- |
|          |                                            |                                            |                         |       | COC16           | COC17           | COC18           |                  |     |     |     |     |
|          |                                            | PAC701 PAC702 PAR202 PAR201 PAC602 PAC601  |                         |       | P A C 1 6 0 2   | P A C 1 7 0 2   | P A C 1 8 0 2   | COC19            |     |     |     |     |
|          | COLED0 COC7 PAR1401 PAR1402 PAR402 PAR401  |                                            | COC27 COC11             |       |                 |                 |                 |                  |     |     |     |     |
|          |                                            |                                            |                         |       | P A C 1 6 0 1   | P A C 1 7 0 1   | P A C 1 8 0 1   |                  |     |     |     |     |
|          |                                            | PA R150 1  PAR15                           | 02 PAC1 202  PA C1201   |       |                 |                 |                 |                  |     |     |     |     |
| PASW102  |                                            | PALED002 PALED001                          | COR11                   | COR3  |                 |                 |                 |                  |     |     |     |     |
| COSW1    |                                            | C O R 2                                    |   C O C 6               |       |                 |                 |                 |                  |     |     |     |     |
COLED1
|                  |     | C O R 1            | 4   CO R 4    |     |     | PAR1302  PAR1301 COR13  |     |     |     |     |     |            |
| ---------------- | --- | ------------------ | ------------- | --- | --- | ----------------------- | --- | --- | --- | --- | --- | ---------- |
| CPAOSWH10O1 LE4  |     | PALED102 PALED101  |               |     |     |                         |     |     |     |     |     |            |
|                  |     | C O R 1            | 5  C O C 1 2  |     |     |                         |     |     |     |     |     | COHOLE3    |
| PAHOLE400        |     |                    |               |     |     |                         |     |     |     |     |     | PAHOLE300  |
PAJP102  PAJP104  PAJP106  PAJP108  PAJP1010  PAJP1012  PAJP1014  PAJP1016  PAJP1018  PAJP1020  PAJP1022  PAJP1024  PAJP1026  PAJP1028  PAJP1030  PAJP1032  PAJP1034  PAJP1036  PAJP1038  PAJP1040  PAJP1042  PAJP1044  PAJP1046  PAJP1048  PAJP1050
COJP1
PAJP101  PAJP103  PAJP105  PAJP107  PAJP109  PAJP1011  PAJP1013  PAJP1015  PAJP1017  PAJP1019  PAJP1021  PAJP1023  PAJP1025  PAJP1027  PAJP1029  PAJP1031  PAJP1033  PAJP1035  PAJP1037  PAJP1039  PAJP1041  PAJP1043  PAJP1045  PAJP1047  PAJP1049