# Arquitetura — EF-23

Não há serviço novo. A fila que o portal recebe já passou por `Visivel` (RN-04, RN-05, RN-33). A busca de texto roda só nessa lista e compara protocolo, empresa e espaço (`Demanda.Sala`, exposto como `local`).

A faixa de situação e próximo passo fica no portal. Avançar, aprovar, encerrar, marcar leitura e encerrar comunicado continuam nos casos de uso que já gravam o histórico.
