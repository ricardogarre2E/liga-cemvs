import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import logo from "./assets/cemvs-logo.png";

export default function AppPublico() {
  const [abaAtiva, setAbaAtiva] = useState("dashboard");
  const [times, setTimes] = useState([]);
  const [jogos, setJogos] = useState([]);
  const [jogadores, setJogadores] = useState([]);
  const [mensagem, setMensagem] = useState("Carregando dados...");

  useEffect(() => {
    carregarDados();
  }, []);

  function getVisitante(jogo) {
    return (
      jogo.visitante_nome ||
      jogo.visitante ||
      jogo.time_visitante ||
      jogo.fora ||
      jogo.adversario ||
      "-"
    );
  }

  function getCasa(jogo) {
    return jogo.casa_nome || jogo.casa || jogo.time_casa || "-";
  }

  function getDataJogo(jogo) {
    return jogo.data || jogo.dados || "-";
  }

  async function carregarDados() {
    try {
      const { data: timesData, error: timesError } = await supabase
        .from("times")
        .select("*");

      const { data: jogosData, error: jogosError } = await supabase
        .from("jogos_cemvs")
        .select("*")
        .order("rodada", { ascending: true });

      const { data: jogadoresData, error: jogadoresError } = await supabase
        .from("jogadores")
        .select("*");

      if (timesError) console.error("Erro ao carregar times:", timesError);
      if (jogosError) console.error("Erro ao carregar jogos:", jogosError);
      if (jogadoresError) console.error("Erro ao carregar jogadores:", jogadoresError);

      setTimes(timesData || []);
      setJogos(jogosData || []);
      setJogadores(jogadoresData || []);
      setMensagem("Atualizado");
    } catch (error) {
      console.error("Erro geral:", error);
      setMensagem("Erro ao carregar");
    }
  }

  const classificacao = useMemo(() => {
    return [...times].sort((a, b) => {
      if ((b.pontos || 0) !== (a.pontos || 0)) return (b.pontos || 0) - (a.pontos || 0);
      if ((b.vitorias || 0) !== (a.vitorias || 0)) return (b.vitorias || 0) - (a.vitorias || 0);
      if ((b.saldo || 0) !== (a.saldo || 0)) return (b.saldo || 0) - (a.saldo || 0);
      return (b.gols_pro || 0) - (a.gols_pro || 0);
    });
  }, [times]);

  const artilheiros = useMemo(() => {
    return [...jogadores]
      .filter((j) => (j.gols || 0) > 0)
      .sort((a, b) => {
        if ((b.gols || 0) !== (a.gols || 0)) return (b.gols || 0) - (a.gols || 0);
        return (a.nome || "").localeCompare(b.nome || "");
      });
  }, [jogadores]);

  const cartoes = useMemo(() => {
    return [...jogadores]
      .filter(
        (j) => (j.cartoes_amarelos || 0) > 0 || (j.cartoes_vermelhos || 0) > 0
      )
      .sort((a, b) => {
        const totalB = (b.cartoes_vermelhos || 0) * 2 + (b.cartoes_amarelos || 0);
        const totalA = (a.cartoes_vermelhos || 0) * 2 + (a.cartoes_amarelos || 0);
        if (totalB !== totalA) return totalB - totalA;
        return (a.nome || "").localeCompare(b.nome || "");
      });
  }, [jogadores]);

  const resultados = useMemo(() => {
    return [...jogos]
      .filter((j) => j.finalizado === true)
      .sort((a, b) => Number(b.rodada || 0) - Number(a.rodada || 0));
  }, [jogos]);

  const agenda = useMemo(() => {
    return [...jogos]
      .filter((j) => !j.finalizado)
      .sort((a, b) => Number(a.rodada || 0) - Number(b.rodada || 0));
  }, [jogos]);

  const lider = classificacao[0];
  const artilheiroLider = artilheiros[0];
  const proximoJogo = agenda[0];

  function medalha(posicao) {
    if (posicao === 0) return "1";
    if (posicao === 1) return "2";
    if (posicao === 2) return "3";
    return `${posicao + 1}`;
  }

  return (
    <div style={pageStyle}>
      <header style={topBarStyle}>
        <div style={brandWrapStyle}>
          <img src={logo} alt="Logo CEMVS" style={logoStyle} />
          <div>
            <div style={leagueBadgeStyle}>LIGA CEMVS</div>
            <h1 style={titleStyle}>Ao vivo do campeonato</h1>
            <div style={subTitleStyle}>{mensagem}</div>
          </div>
        </div>

        <button onClick={carregarDados} style={refreshButtonStyle}>
          Atualizar
        </button>
      </header>

      <section style={heroMatchStyle}>
        <div style={heroHeaderStyle}>
          <span style={statusChipStyle}>PRÓXIMO JOGO</span>
          <span style={heroMetaStyle}>
            {proximoJogo ? `Rodada ${proximoJogo.rodada}` : "Sem partida pendente"}
          </span>
        </div>

        {proximoJogo ? (
          <>
            <div style={heroTeamsRowStyle}>
              <div style={heroTeamStyle}>
                <div style={heroTeamNameStyle}>{getCasa(proximoJogo)}</div>
              </div>

              <div style={heroCenterStyle}>
                <div style={heroVsStyle}>VS</div>
                <div style={heroTimeStyle}>{proximoJogo.horario || "-"}</div>
              </div>

              <div style={heroTeamStyle}>
                <div style={heroTeamNameStyle}>{getVisitante(proximoJogo)}</div>
              </div>
            </div>

            <div style={heroFooterStyle}>
              <span>{getDataJogo(proximoJogo)}</span>
              <span>•</span>
              <span>{proximoJogo.dia || "-"}</span>
            </div>
          </>
        ) : (
          <div style={heroEmptyStyle}>Nenhum jogo pendente no momento.</div>
        )}
      </section>

      <div style={summaryGridStyle}>
        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Líder</div>
          <div style={summaryMainStyle}>{lider ? lider.nome : "-"}</div>
          <div style={summarySubStyle}>
            {lider ? `${lider.pontos || 0} pts` : "Sem dados"}
          </div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Artilheiro</div>
          <div style={summaryMainStyle}>{artilheiroLider ? artilheiroLider.nome : "-"}</div>
          <div style={summarySubStyle}>
            {artilheiroLider ? `${artilheiroLider.gols || 0} gols` : "Sem dados"}
          </div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Jogos</div>
          <div style={summaryMainStyle}>{jogos.length}</div>
          <div style={summarySubStyle}>{agenda.length} pendentes</div>
        </div>
      </div>

      <div style={tabsWrapStyle}>
        <button
          style={abaAtiva === "dashboard" ? tabActiveStyle : tabStyle}
          onClick={() => setAbaAtiva("dashboard")}
        >
          Destaques
        </button>
        <button
          style={abaAtiva === "jogos" ? tabActiveStyle : tabStyle}
          onClick={() => setAbaAtiva("jogos")}
        >
          Jogos
        </button>
        <button
          style={abaAtiva === "resultados" ? tabActiveStyle : tabStyle}
          onClick={() => setAbaAtiva("resultados")}
        >
          Resultados
        </button>
        <button
          style={abaAtiva === "classificacao" ? tabActiveStyle : tabStyle}
          onClick={() => setAbaAtiva("classificacao")}
        >
          Tabela
        </button>
        <button
          style={abaAtiva === "artilheiros" ? tabActiveStyle : tabStyle}
          onClick={() => setAbaAtiva("artilheiros")}
        >
          Artilheiros
        </button>
        <button
          style={abaAtiva === "cartoes" ? tabActiveStyle : tabStyle}
          onClick={() => setAbaAtiva("cartoes")}
        >
          Cartões
        </button>
      </div>

      {abaAtiva === "dashboard" && (
        <div style={mainGridStyle}>
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>Próximas partidas</h2>
            </div>

            <div style={matchListStyle}>
              {agenda.map((jogo) => (
                <div key={jogo.id} style={flashMatchCardStyle}>
                  <div style={flashMetaRowStyle}>
                    <span style={roundPillStyle}>Rodada {jogo.rodada}</span>
                    <span style={flashDateStyle}>{getDataJogo(jogo)}</span>
                  </div>

                  <div style={flashTeamsWrapStyle}>
                    <div style={flashTeamRowStyle}>
                      <span style={flashTeamNameStyle}>{getCasa(jogo)}</span>
                    </div>

                    <div style={flashDividerStyle} />

                    <div style={flashTeamRowStyle}>
                      <span style={flashTeamNameStyle}>{getVisitante(jogo)}</span>
                    </div>
                  </div>

                  <div style={flashBottomMetaStyle}>
                    {jogo.dia || "-"} • {jogo.horario || "-"}
                  </div>
                </div>
              ))}

              {agenda.length === 0 && (
                <div style={emptyCardStyle}>Nenhum jogo pendente.</div>
              )}
            </div>
          </section>

          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>Top 5 artilheiros</h2>
            </div>

            <div style={listStyle}>
              {artilheiros.slice(0, 5).map((j, i) => (
                <div
                  key={j.id}
                  style={{
                    ...playerRowStyle,
                    ...(i === 0 ? playerLeaderStyle : {}),
                  }}
                >
                  <div style={playerLeftStyle}>
                    <div style={positionBubbleStyle}>{i + 1}</div>
                    <div>
                      <div style={playerNameStyle}>{j.nome}</div>
                      <div style={playerTeamStyle}>{j.time_nome}</div>
                    </div>
                  </div>

                  <div style={goalsBadgeStyle}>{j.gols || 0}</div>
                </div>
              ))}

              {artilheiros.length === 0 && (
                <div style={emptyCardStyle}>Nenhum gol lançado ainda.</div>
              )}
            </div>
          </section>
        </div>
      )}

      {abaAtiva === "jogos" && (
        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h2 style={panelTitleStyle}>Próximos jogos</h2>
          </div>

          <div style={matchListStyle}>
            {agenda.map((jogo) => (
              <div key={jogo.id} style={scoreboardCardStyle}>
                <div style={scoreboardHeaderStyle}>
                  <span style={roundPillStyle}>Rodada {jogo.rodada}</span>
                  <span style={flashDateStyle}>{getDataJogo(jogo)}</span>
                </div>

                <div style={scoreboardTeamsStyle}>
                  <div style={scoreboardTeamStyle}>{getCasa(jogo)}</div>
                  <div style={scoreboardMiddleStyle}>
                    <div style={versusMiniStyle}>VS</div>
                    <div style={scheduleTimeStyle}>{jogo.horario || "-"}</div>
                  </div>
                  <div style={scoreboardTeamStyle}>{getVisitante(jogo)}</div>
                </div>

                <div style={scoreboardFooterStyle}>{jogo.dia || "-"}</div>
              </div>
            ))}

            {agenda.length === 0 && (
              <div style={emptyCardStyle}>Nenhum jogo pendente.</div>
            )}
          </div>
        </section>
      )}

      {abaAtiva === "resultados" && (
        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h2 style={panelTitleStyle}>Últimos resultados</h2>
          </div>

          <div style={matchListStyle}>
            {resultados.map((jogo) => (
              <div key={jogo.id} style={resultFlashCardStyle}>
                <div style={scoreboardHeaderStyle}>
                  <span style={roundPillStyle}>Rodada {jogo.rodada}</span>
                  <span style={flashDateStyle}>{getDataJogo(jogo)}</span>
                </div>

                <div style={resultRowStyle}>
                  <div style={resultTeamStyle}>{getCasa(jogo)}</div>
                  <div style={resultScoreStyle}>
                    {Number(jogo.gols_casa || 0)} <span style={resultXStyle}>x</span>{" "}
                    {Number(jogo.gols_visitante || 0)}
                  </div>
                  <div style={resultTeamStyle}>{getVisitante(jogo)}</div>
                </div>
              </div>
            ))}

            {resultados.length === 0 && (
              <div style={emptyCardStyle}>Nenhum resultado lançado ainda.</div>
            )}
          </div>
        </section>
      )}

      {abaAtiva === "classificacao" && (
        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h2 style={panelTitleStyle}>Tabela</h2>
          </div>

          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>PTS</th>
                  <th style={thStyle}>J</th>
                  <th style={thStyle}>V</th>
                  <th style={thStyle}>E</th>
                  <th style={thStyle}>D</th>
                  <th style={thStyle}>SG</th>
                </tr>
              </thead>
              <tbody>
                {classificacao.map((time, i) => (
                  <tr key={time.id} style={i === 0 ? tableLeaderRowStyle : undefined}>
                    <td style={tdStyle}>
                      <div
                        style={{
                          ...tablePosStyle,
                          ...(i === 0
                            ? posLeaderStyle
                            : i === 1
                            ? posViceStyle
                            : i === 2
                            ? posThirdStyle
                            : {}),
                        }}
                      >
                        {medalha(i)}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: "800" }}>{time.nome}</td>
                    <td style={{ ...tdStyle, fontWeight: "800" }}>{time.pontos || 0}</td>
                    <td style={tdStyle}>{time.jogos || 0}</td>
                    <td style={tdStyle}>{time.vitorias || 0}</td>
                    <td style={tdStyle}>{time.empates || 0}</td>
                    <td style={tdStyle}>{time.derrotas || 0}</td>
                    <td style={tdStyle}>{time.saldo || 0}</td>
                  </tr>
                ))}

                {classificacao.length === 0 && (
                  <tr>
                    <td style={tdStyle} colSpan="8">Nenhum time cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {abaAtiva === "artilheiros" && (
        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h2 style={panelTitleStyle}>Artilheiros</h2>
          </div>

          <div style={listStyle}>
            {artilheiros.map((jogador, i) => (
              <div
                key={jogador.id}
                style={{
                  ...playerRowStyle,
                  ...(i === 0 ? playerLeaderStyle : {}),
                }}
              >
                <div style={playerLeftStyle}>
                  <div style={positionBubbleStyle}>{i + 1}</div>
                  <div>
                    <div style={playerNameStyle}>{jogador.nome}</div>
                    <div style={playerTeamStyle}>{jogador.time_nome || "-"}</div>
                  </div>
                </div>

                <div style={goalsBadgeStyle}>{jogador.gols || 0}</div>
              </div>
            ))}

            {artilheiros.length === 0 && (
              <div style={emptyCardStyle}>Nenhum gol lançado ainda.</div>
            )}
          </div>
        </section>
      )}

      {abaAtiva === "cartoes" && (
        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h2 style={panelTitleStyle}>Cartões</h2>
          </div>

          <div style={listStyle}>
            {cartoes.map((jogador) => (
              <div key={jogador.id} style={playerRowStyle}>
                <div style={playerLeftStyle}>
                  <div style={cardsIconStyle}>🟨🟥</div>
                  <div>
                    <div style={playerNameStyle}>{jogador.nome}</div>
                    <div style={playerTeamStyle}>{jogador.time_nome || "-"}</div>
                  </div>
                </div>

                <div style={cardsWrapStyle}>
                  <span style={yellowBadgeStyle}>{jogador.cartoes_amarelos || 0}</span>
                  <span style={redBadgeStyle}>{jogador.cartoes_vermelhos || 0}</span>
                </div>
              </div>
            ))}

            {cartoes.length === 0 && (
              <div style={emptyCardStyle}>Nenhum cartão lançado ainda.</div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#08111f",
  color: "#ffffff",
  padding: "12px",
  fontFamily: "system-ui, Arial, sans-serif",
  maxWidth: "980px",
  margin: "0 auto",
};

const topBarStyle = {
  background: "linear-gradient(135deg, #0f1d34 0%, #13233d 100%)",
  border: "1px solid #1f3256",
  borderRadius: "18px",
  padding: "14px",
  marginBottom: "12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const brandWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const logoStyle = {
  width: "54px",
  height: "54px",
  background: "#fff",
  borderRadius: "12px",
  padding: "6px",
  objectFit: "contain",
};

const leagueBadgeStyle = {
  display: "inline-block",
  background: "linear-gradient(90deg, #2563eb, #7c3aed)",
  padding: "4px 10px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: "800",
  marginBottom: "6px",
};

const titleStyle = {
  margin: 0,
  fontSize: "22px",
  fontWeight: "800",
};

const subTitleStyle = {
  fontSize: "12px",
  color: "#93a7c7",
  marginTop: "4px",
};

const refreshButtonStyle = {
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#fff",
  borderRadius: "12px",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: "700",
};

const heroMatchStyle = {
  background: "linear-gradient(135deg, #111c30 0%, #0f172a 100%)",
  border: "1px solid #263854",
  borderRadius: "18px",
  padding: "16px",
  marginBottom: "12px",
  boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
};

const heroHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: "14px",
};

const statusChipStyle = {
  background: "linear-gradient(90deg, #2563eb, #7c3aed)",
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "11px",
  fontWeight: "800",
};

const heroMetaStyle = {
  fontSize: "12px",
  color: "#9fb1cd",
};

const heroTeamsRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  gap: "12px",
  alignItems: "center",
};

const heroTeamStyle = {
  textAlign: "center",
};

const heroTeamNameStyle = {
  fontSize: "20px",
  fontWeight: "800",
  lineHeight: 1.2,
};

const heroCenterStyle = {
  textAlign: "center",
};

const heroVsStyle = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#94a3b8",
  marginBottom: "6px",
};

const heroTimeStyle = {
  fontSize: "20px",
  fontWeight: "900",
  color: "#ffffff",
};

const heroFooterStyle = {
  marginTop: "14px",
  display: "flex",
  justifyContent: "center",
  gap: "8px",
  flexWrap: "wrap",
  fontSize: "13px",
  color: "#9fb1cd",
};

const heroEmptyStyle = {
  padding: "18px",
  borderRadius: "14px",
  background: "#0b1425",
  textAlign: "center",
  color: "#9fb1cd",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "10px",
  marginBottom: "12px",
};

const summaryCardStyle = {
  background: "#0f172a",
  border: "1px solid #22304a",
  borderRadius: "16px",
  padding: "14px",
};

const summaryLabelStyle = {
  fontSize: "12px",
  color: "#94a3b8",
  marginBottom: "8px",
};

const summaryMainStyle = {
  fontSize: "16px",
  fontWeight: "800",
};

const summarySubStyle = {
  fontSize: "12px",
  color: "#cbd5e1",
  marginTop: "4px",
};

const tabsWrapStyle = {
  display: "flex",
  gap: "8px",
  overflowX: "auto",
  paddingBottom: "6px",
  marginBottom: "12px",
};

const tabStyle = {
  border: "1px solid #24334e",
  borderRadius: "999px",
  padding: "10px 14px",
  background: "#0f172a",
  color: "#dbe5f4",
  fontSize: "13px",
  fontWeight: "800",
  whiteSpace: "nowrap",
  cursor: "pointer",
};

const tabActiveStyle = {
  ...tabStyle,
  background: "linear-gradient(90deg, #2563eb, #7c3aed)",
  borderColor: "transparent",
  color: "#fff",
};

const mainGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "12px",
};

const panelStyle = {
  background: "#0f172a",
  border: "1px solid #22304a",
  borderRadius: "18px",
  padding: "14px",
};

const panelHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "12px",
};

const panelTitleStyle = {
  margin: 0,
  fontSize: "17px",
  fontWeight: "800",
};

const matchListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const flashMatchCardStyle = {
  background: "#0b1425",
  border: "1px solid #20304a",
  borderRadius: "14px",
  padding: "12px",
};

const flashMetaRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  marginBottom: "10px",
};

const roundPillStyle = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "999px",
  background: "rgba(37,99,235,0.16)",
  color: "#cfe1ff",
  fontSize: "11px",
  fontWeight: "800",
};

const flashDateStyle = {
  fontSize: "12px",
  color: "#94a3b8",
};

const flashTeamsWrapStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const flashTeamRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const flashTeamNameStyle = {
  fontSize: "15px",
  fontWeight: "800",
};

const flashDividerStyle = {
  height: "1px",
  background: "#1e293b",
};

const flashBottomMetaStyle = {
  marginTop: "10px",
  fontSize: "12px",
  color: "#9fb1cd",
};

const scoreboardCardStyle = {
  background: "#0b1425",
  border: "1px solid #20304a",
  borderRadius: "14px",
  padding: "12px",
};

const scoreboardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "8px",
  marginBottom: "12px",
  flexWrap: "wrap",
};

const scoreboardTeamsStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  gap: "10px",
};

const scoreboardTeamStyle = {
  textAlign: "center",
  fontWeight: "800",
  fontSize: "15px",
};

const scoreboardMiddleStyle = {
  textAlign: "center",
};

const versusMiniStyle = {
  fontSize: "11px",
  color: "#94a3b8",
  fontWeight: "800",
};

const scheduleTimeStyle = {
  marginTop: "4px",
  fontSize: "16px",
  fontWeight: "900",
};

const scoreboardFooterStyle = {
  marginTop: "12px",
  textAlign: "center",
  fontSize: "12px",
  color: "#9fb1cd",
};

const resultFlashCardStyle = {
  background: "linear-gradient(135deg, rgba(16,185,129,0.10), #0b1425)",
  border: "1px solid rgba(16,185,129,0.28)",
  borderRadius: "14px",
  padding: "12px",
};

const resultRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  gap: "10px",
};

const resultTeamStyle = {
  textAlign: "center",
  fontSize: "15px",
  fontWeight: "800",
};

const resultScoreStyle = {
  fontSize: "26px",
  fontWeight: "900",
  color: "#10b981",
  textAlign: "center",
  whiteSpace: "nowrap",
};

const resultXStyle = {
  color: "#dbeafe",
};

const listStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const playerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  background: "#0b1425",
  border: "1px solid #20304a",
  borderRadius: "14px",
  padding: "12px",
};

const playerLeaderStyle = {
  background: "linear-gradient(135deg, rgba(124,58,237,0.16), #0b1425)",
  border: "1px solid rgba(124,58,237,0.35)",
};

const playerLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
};

const positionBubbleStyle = {
  minWidth: "34px",
  height: "34px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  fontWeight: "800",
};

const playerNameStyle = {
  fontSize: "14px",
  fontWeight: "800",
};

const playerTeamStyle = {
  fontSize: "12px",
  color: "#94a3b8",
};

const goalsBadgeStyle = {
  minWidth: "42px",
  height: "42px",
  borderRadius: "12px",
  background: "rgba(16,185,129,0.14)",
  color: "#10b981",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900",
  fontSize: "18px",
};

const cardsIconStyle = {
  minWidth: "38px",
  height: "38px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
};

const cardsWrapStyle = {
  display: "flex",
  gap: "8px",
};

const yellowBadgeStyle = {
  minWidth: "34px",
  height: "34px",
  borderRadius: "8px",
  background: "#facc15",
  color: "#111827",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900",
};

const redBadgeStyle = {
  minWidth: "34px",
  height: "34px",
  borderRadius: "8px",
  background: "#ef4444",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900",
};

const emptyCardStyle = {
  background: "#0b1425",
  border: "1px dashed #314158",
  borderRadius: "14px",
  padding: "16px",
  textAlign: "center",
  color: "#94a3b8",
  fontSize: "14px",
};

const tableWrapStyle = {
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle = {
  textAlign: "left",
  padding: "12px 8px",
  borderBottom: "1px solid #24334e",
  fontSize: "12px",
  color: "#9fb1cd",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px 8px",
  borderBottom: "1px solid #182437",
  fontSize: "13px",
  color: "#f8fafc",
  whiteSpace: "nowrap",
};

const tableLeaderRowStyle = {
  background: "rgba(16,185,129,0.08)",
};

const tablePosStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "999px",
  background: "#162235",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  fontSize: "12px",
};

const posLeaderStyle = {
  background: "rgba(16,185,129,0.22)",
  color: "#a7f3d0",
};

const posViceStyle = {
  background: "rgba(37,99,235,0.20)",
  color: "#bfdbfe",
};

const posThirdStyle = {
  background: "rgba(124,58,237,0.20)",
  color: "#ddd6fe",
};