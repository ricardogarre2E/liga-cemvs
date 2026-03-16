import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import logo from "./assets/cemvs-logo.png";

export default function AppAdmin() {
  const [abaAtiva, setAbaAtiva] = useState("dashboard");
  const [times, setTimes] = useState([]);
  const [jogadores, setJogadores] = useState([]);
  const [jogos, setJogos] = useState([]);
  const [mensagem, setMensagem] = useState("");

  const [novoTime, setNovoTime] = useState("");

  const [novoJogador, setNovoJogador] = useState({
    nome: "",
    time_id: "",
  });

  const [novoJogo, setNovoJogo] = useState({
    rodada: "",
    data: "",
    dia: "",
    horario: "",
    casa: "",
    visitante: "",
  });

  const [estatisticaJogador, setEstatisticaJogador] = useState({
    jogador_id: "",
    gols: "",
    cartoes_amarelos: "",
    cartoes_vermelhos: "",
  });

  const [resultadoJogo, setResultadoJogo] = useState({
    jogo_id: "",
    gols_casa: "",
    gols_visitante: "",
  });

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
    setMensagem("");

    const { data: timesData, error: timesError } = await supabase
      .from("times")
      .select("*");

    const { data: jogadoresData, error: jogadoresError } = await supabase
      .from("jogadores")
      .select("*")
      .order("nome", { ascending: true });

    const { data: jogosData, error: jogosError } = await supabase
      .from("jogos_cemvs")
      .select("*")
      .order("rodada", { ascending: true });

    if (timesError) console.error("Erro ao carregar times:", timesError);
    if (jogadoresError) console.error("Erro ao carregar jogadores:", jogadoresError);
    if (jogosError) console.error("Erro ao carregar jogos:", jogosError);

    setTimes(timesData || []);
    setJogadores(jogadoresData || []);
    setJogos(jogosData || []);
  }

  async function cadastrarTime(e) {
    e.preventDefault();

    if (!novoTime.trim()) {
      setMensagem("Digite o nome do time.");
      return;
    }

    const nomeLimpo = novoTime.trim();

    const existe = times.some(
      (t) => (t.nome || "").toLowerCase() === nomeLimpo.toLowerCase()
    );

    if (existe) {
      setMensagem("Esse time já está cadastrado.");
      return;
    }

    const { error } = await supabase.from("times").insert({
      nome: nomeLimpo,
      pontos: 0,
      jogos: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      gols_pro: 0,
      gols_contra: 0,
      saldo: 0,
    });

    if (error) {
      console.error(error);
      setMensagem("Erro ao cadastrar time.");
      return;
    }

    setNovoTime("");
    setMensagem("Time cadastrado com sucesso.");
    carregarDados();
  }

  async function cadastrarJogador(e) {
    e.preventDefault();

    if (!novoJogador.nome.trim() || !novoJogador.time_id) {
      setMensagem("Preencha nome e time do jogador.");
      return;
    }

    const timeSelecionado = times.find(
      (t) => String(t.id) === String(novoJogador.time_id)
    );

    if (!timeSelecionado) {
      setMensagem("Selecione um time válido.");
      return;
    }

    const { error } = await supabase.from("jogadores").insert({
      nome: novoJogador.nome.trim(),
      time_id: timeSelecionado.id,
      time_nome: timeSelecionado.nome,
      gols: 0,
      cartoes_amarelos: 0,
      cartoes_vermelhos: 0,
    });

    if (error) {
      console.error(error);
      setMensagem("Erro ao cadastrar jogador.");
      return;
    }

    setNovoJogador({
      nome: "",
      time_id: "",
    });

    setMensagem("Jogador cadastrado com sucesso.");
    carregarDados();
  }

  async function cadastrarJogo(e) {
    e.preventDefault();

    if (
      !novoJogo.rodada ||
      !novoJogo.dia.trim() ||
      !novoJogo.horario.trim() ||
      !novoJogo.casa.trim() ||
      !novoJogo.visitante.trim()
    ) {
      setMensagem("Preencha rodada, dia, horário, casa e visitante.");
      return;
    }

    if (novoJogo.casa === novoJogo.visitante) {
      setMensagem("Casa e visitante não podem ser iguais.");
      return;
    }

    const payload = {
      rodada: Number(novoJogo.rodada),
      dia: novoJogo.dia.trim(),
      horario: novoJogo.horario.trim(),
      casa: novoJogo.casa.trim(),
      visitante: novoJogo.visitante.trim(),
      data: novoJogo.data || null,
      gols_casa: 0,
      gols_visitante: 0,
      finalizado: false,
    };

    const { error } = await supabase.from("jogos_cemvs").insert(payload);

    if (error) {
      console.error(error);
      setMensagem("Erro ao cadastrar jogo.");
      return;
    }

    setNovoJogo({
      rodada: "",
      data: "",
      dia: "",
      horario: "",
      casa: "",
      visitante: "",
    });

    setMensagem("Jogo cadastrado com sucesso.");
    carregarDados();
  }

  async function lancarEstatisticaJogador(e) {
    e.preventDefault();

    if (!estatisticaJogador.jogador_id) {
      setMensagem("Selecione um jogador.");
      return;
    }

    const jogador = jogadores.find(
      (j) => String(j.id) === String(estatisticaJogador.jogador_id)
    );

    if (!jogador) {
      setMensagem("Jogador não encontrado.");
      return;
    }

    const novosGols = Number(estatisticaJogador.gols || 0);
    const novosAmarelos = Number(estatisticaJogador.cartoes_amarelos || 0);
    const novosVermelhos = Number(estatisticaJogador.cartoes_vermelhos || 0);

    if (novosGols < 0 || novosAmarelos < 0 || novosVermelhos < 0) {
      setMensagem("Os valores não podem ser negativos.");
      return;
    }

    const { error } = await supabase
      .from("jogadores")
      .update({
        gols: Number(jogador.gols || 0) + novosGols,
        cartoes_amarelos: Number(jogador.cartoes_amarelos || 0) + novosAmarelos,
        cartoes_vermelhos: Number(jogador.cartoes_vermelhos || 0) + novosVermelhos,
      })
      .eq("id", jogador.id);

    if (error) {
      console.error(error);
      setMensagem("Erro ao lançar estatísticas do jogador.");
      return;
    }

    setEstatisticaJogador({
      jogador_id: "",
      gols: "",
      cartoes_amarelos: "",
      cartoes_vermelhos: "",
    });

    setMensagem("Estatísticas atualizadas.");
    carregarDados();
  }

  async function lancarResultado(e) {
    e.preventDefault();

    if (!resultadoJogo.jogo_id) {
      setMensagem("Selecione um jogo.");
      return;
    }

    const jogo = jogos.find((j) => String(j.id) === String(resultadoJogo.jogo_id));

    if (!jogo) {
      setMensagem("Jogo não encontrado.");
      return;
    }

    if (jogo.finalizado) {
      setMensagem("Esse jogo já foi finalizado.");
      return;
    }

    const golsCasa = Number(resultadoJogo.gols_casa || 0);
    const golsVisitante = Number(resultadoJogo.gols_visitante || 0);

    if (golsCasa < 0 || golsVisitante < 0) {
      setMensagem("Os gols não podem ser negativos.");
      return;
    }

    const timeCasa = times.find((t) => t.nome === getCasa(jogo));
    const timeVisitante = times.find((t) => t.nome === getVisitante(jogo));

    if (!timeCasa || !timeVisitante) {
      setMensagem("Times do jogo não encontrados.");
      return;
    }

    const updateJogo = await supabase
      .from("jogos_cemvs")
      .update({
        gols_casa: golsCasa,
        gols_visitante: golsVisitante,
        finalizado: true,
      })
      .eq("id", jogo.id);

    if (updateJogo.error) {
      console.error(updateJogo.error);
      setMensagem("Erro ao atualizar resultado do jogo.");
      return;
    }

    const novoCasa = {
      jogos: Number(timeCasa.jogos || 0) + 1,
      vitorias: Number(timeCasa.vitorias || 0),
      empates: Number(timeCasa.empates || 0),
      derrotas: Number(timeCasa.derrotas || 0),
      pontos: Number(timeCasa.pontos || 0),
      gols_pro: Number(timeCasa.gols_pro || 0) + golsCasa,
      gols_contra: Number(timeCasa.gols_contra || 0) + golsVisitante,
    };

    const novoVisitante = {
      jogos: Number(timeVisitante.jogos || 0) + 1,
      vitorias: Number(timeVisitante.vitorias || 0),
      empates: Number(timeVisitante.empates || 0),
      derrotas: Number(timeVisitante.derrotas || 0),
      pontos: Number(timeVisitante.pontos || 0),
      gols_pro: Number(timeVisitante.gols_pro || 0) + golsVisitante,
      gols_contra: Number(timeVisitante.gols_contra || 0) + golsCasa,
    };

    if (golsCasa > golsVisitante) {
      novoCasa.vitorias += 1;
      novoCasa.pontos += 3;
      novoVisitante.derrotas += 1;
    } else if (golsCasa < golsVisitante) {
      novoVisitante.vitorias += 1;
      novoVisitante.pontos += 3;
      novoCasa.derrotas += 1;
    } else {
      novoCasa.empates += 1;
      novoVisitante.empates += 1;
      novoCasa.pontos += 1;
      novoVisitante.pontos += 1;
    }

    novoCasa.saldo = novoCasa.gols_pro - novoCasa.gols_contra;
    novoVisitante.saldo = novoVisitante.gols_pro - novoVisitante.gols_contra;

    const updateCasa = await supabase
      .from("times")
      .update(novoCasa)
      .eq("id", timeCasa.id);

    const updateVisitante = await supabase
      .from("times")
      .update(novoVisitante)
      .eq("id", timeVisitante.id);

    if (updateCasa.error || updateVisitante.error) {
      console.error(updateCasa.error || updateVisitante.error);
      setMensagem("Erro ao atualizar classificação.");
      return;
    }

    setResultadoJogo({
      jogo_id: "",
      gols_casa: "",
      gols_visitante: "",
    });

    setMensagem("Resultado lançado com sucesso.");
    carregarDados();
  }

  async function excluirJogo(id) {
    const confirmar = window.confirm("Deseja excluir este jogo?");
    if (!confirmar) return;

    const { error } = await supabase.from("jogos_cemvs").delete().eq("id", id);

    if (error) {
      console.error(error);
      setMensagem("Erro ao excluir jogo.");
      return;
    }

    setMensagem("Jogo excluído com sucesso.");
    carregarDados();
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

  const jogosPendentes = useMemo(() => {
    return jogos.filter((j) => !j.finalizado);
  }, [jogos]);

  const lider = classificacao[0];
  const artilheiroLider = artilheiros[0];
  const proximoJogo = jogosPendentes[0];

  return (
    <div style={pageStyle}>
      <header style={topBarStyle}>
        <div style={brandWrapStyle}>
          <img src={logo} alt="Logo CEMVS" style={logoStyle} />
          <div>
            <div style={leagueBadgeStyle}>ADMIN LIGA CEMVS</div>
            <h1 style={titleStyle}>Painel do campeonato</h1>
            <div style={subTitleStyle}>
              Controle de times, jogos, resultados e estatísticas
            </div>
          </div>
        </div>

        <button onClick={carregarDados} style={refreshButtonStyle}>
          Atualizar
        </button>
      </header>

      {mensagem ? <div style={alertStyle}>{mensagem}</div> : null}

      <section style={heroMatchStyle}>
        <div style={heroHeaderStyle}>
          <span style={statusChipStyle}>PRÓXIMA PARTIDA</span>
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
          <div style={summaryLabelStyle}>Times</div>
          <div style={summaryMainStyle}>{times.length}</div>
          <div style={summarySubStyle}>Cadastrados</div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Jogadores</div>
          <div style={summaryMainStyle}>{jogadores.length}</div>
          <div style={summarySubStyle}>Cadastrados</div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Jogos</div>
          <div style={summaryMainStyle}>{jogos.length}</div>
          <div style={summarySubStyle}>{jogosPendentes.length} pendentes</div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Líder</div>
          <div style={summaryMainStyle}>{lider ? lider.nome : "-"}</div>
          <div style={summarySubStyle}>{lider ? `${lider.pontos || 0} pts` : "Sem dados"}</div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Artilheiro</div>
          <div style={summaryMainStyle}>{artilheiroLider ? artilheiroLider.nome : "-"}</div>
          <div style={summarySubStyle}>
            {artilheiroLider ? `${artilheiroLider.gols || 0} gols` : "Sem dados"}
          </div>
        </div>
      </div>

      <div style={tabsWrapStyle}>
        <button
          style={abaAtiva === "dashboard" ? tabActiveStyle : tabStyle}
          onClick={() => setAbaAtiva("dashboard")}
        >
          Dashboard
        </button>
        <button
          style={abaAtiva === "times" ? tabActiveStyle : tabStyle}
          onClick={() => setAbaAtiva("times")}
        >
          Times
        </button>
        <button
          style={abaAtiva === "jogadores" ? tabActiveStyle : tabStyle}
          onClick={() => setAbaAtiva("jogadores")}
        >
          Jogadores
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
      </div>

      {abaAtiva === "dashboard" && (
        <div style={mainGridStyle}>
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>Próximas partidas</h2>
            </div>

            <div style={matchListStyle}>
              {jogosPendentes.map((jogo) => (
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

              {jogosPendentes.length === 0 && (
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

      {abaAtiva === "times" && (
        <div style={mainGridStyle}>
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>Cadastrar time</h2>
            </div>

            <form onSubmit={cadastrarTime} style={formStyle}>
              <input
                type="text"
                placeholder="Nome do time"
                value={novoTime}
                onChange={(e) => setNovoTime(e.target.value)}
                style={inputStyle}
              />

              <button type="submit" style={primaryButtonStyle}>
                Cadastrar time
              </button>
            </form>
          </section>

          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>Classificação rápida</h2>
            </div>

            <div style={listStyle}>
              {classificacao.map((t, i) => (
                <div key={t.id} style={playerRowStyle}>
                  <div style={playerLeftStyle}>
                    <div style={positionBubbleStyle}>{i + 1}</div>
                    <div>
                      <div style={playerNameStyle}>{t.nome}</div>
                      <div style={playerTeamStyle}>
                        J {t.jogos || 0} • V {t.vitorias || 0} • SG {t.saldo || 0}
                      </div>
                    </div>
                  </div>

                  <div style={goalsBadgeStyle}>{t.pontos || 0}</div>
                </div>
              ))}

              {classificacao.length === 0 && (
                <div style={emptyCardStyle}>Nenhum time cadastrado.</div>
              )}
            </div>
          </section>
        </div>
      )}

      {abaAtiva === "jogadores" && (
        <div style={mainGridStyle}>
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>Cadastrar jogador</h2>
            </div>

            <form onSubmit={cadastrarJogador} style={formStyle}>
              <input
                type="text"
                placeholder="Nome do jogador"
                value={novoJogador.nome}
                onChange={(e) =>
                  setNovoJogador((prev) => ({ ...prev, nome: e.target.value }))
                }
                style={inputStyle}
              />

              <select
                value={novoJogador.time_id}
                onChange={(e) =>
                  setNovoJogador((prev) => ({ ...prev, time_id: e.target.value }))
                }
                style={inputStyle}
              >
                <option value="">Selecione o time</option>
                {times.map((time) => (
                  <option key={time.id} value={time.id}>
                    {time.nome}
                  </option>
                ))}
              </select>

              <button type="submit" style={primaryButtonStyle}>
                Cadastrar jogador
              </button>
            </form>
          </section>

          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>Lançar estatísticas</h2>
            </div>

            <form onSubmit={lancarEstatisticaJogador} style={formStyle}>
              <select
                value={estatisticaJogador.jogador_id}
                onChange={(e) =>
                  setEstatisticaJogador((prev) => ({
                    ...prev,
                    jogador_id: e.target.value,
                  }))
                }
                style={inputStyle}
              >
                <option value="">Selecione o jogador</option>
                {jogadores.map((jogador) => (
                  <option key={jogador.id} value={jogador.id}>
                    {jogador.nome} - {jogador.time_nome}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0"
                placeholder="Gols"
                value={estatisticaJogador.gols}
                onChange={(e) =>
                  setEstatisticaJogador((prev) => ({ ...prev, gols: e.target.value }))
                }
                style={inputStyle}
              />

              <input
                type="number"
                min="0"
                placeholder="Cartões amarelos"
                value={estatisticaJogador.cartoes_amarelos}
                onChange={(e) =>
                  setEstatisticaJogador((prev) => ({
                    ...prev,
                    cartoes_amarelos: e.target.value,
                  }))
                }
                style={inputStyle}
              />

              <input
                type="number"
                min="0"
                placeholder="Cartões vermelhos"
                value={estatisticaJogador.cartoes_vermelhos}
                onChange={(e) =>
                  setEstatisticaJogador((prev) => ({
                    ...prev,
                    cartoes_vermelhos: e.target.value,
                  }))
                }
                style={inputStyle}
              />

              <button type="submit" style={primaryButtonStyle}>
                Salvar estatísticas
              </button>
            </form>
          </section>

          <section style={panelStyleFull}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>Lista de jogadores</h2>
            </div>

            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Jogador</th>
                    <th style={thStyle}>Time</th>
                    <th style={thStyle}>Gols</th>
                    <th style={thStyle}>A</th>
                    <th style={thStyle}>V</th>
                  </tr>
                </thead>
                <tbody>
                  {jogadores.map((j) => (
                    <tr key={j.id}>
                      <td style={tdStyle}>{j.nome}</td>
                      <td style={tdStyle}>{j.time_nome}</td>
                      <td style={tdStyle}>{j.gols || 0}</td>
                      <td style={{ ...tdStyle, color: "#facc15", fontWeight: "800" }}>
                        {j.cartoes_amarelos || 0}
                      </td>
                      <td style={{ ...tdStyle, color: "#ef4444", fontWeight: "800" }}>
                        {j.cartoes_vermelhos || 0}
                      </td>
                    </tr>
                  ))}
                  {jogadores.length === 0 && (
                    <tr>
                      <td style={tdStyle} colSpan="5">Nenhum jogador cadastrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {abaAtiva === "jogos" && (
        <div style={mainGridStyle}>
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>Cadastrar jogo</h2>
            </div>

            <form onSubmit={cadastrarJogo} style={formStyle}>
              <input
                type="number"
                placeholder="Rodada"
                value={novoJogo.rodada}
                onChange={(e) =>
                  setNovoJogo((prev) => ({ ...prev, rodada: e.target.value }))
                }
                style={inputStyle}
              />

              <input
                type="text"
                placeholder="Data (ex: 20/03/2026)"
                value={novoJogo.data}
                onChange={(e) =>
                  setNovoJogo((prev) => ({ ...prev, data: e.target.value }))
                }
                style={inputStyle}
              />

              <select
                value={novoJogo.dia}
                onChange={(e) =>
                  setNovoJogo((prev) => ({ ...prev, dia: e.target.value }))
                }
                style={inputStyle}
              >
                <option value="">Selecione o dia</option>
                <option value="Segunda">Segunda</option>
                <option value="Terça">Terça</option>
                <option value="Quarta">Quarta</option>
                <option value="Quinta">Quinta</option>
                <option value="Sexta">Sexta</option>
                <option value="Sábado">Sábado</option>
                <option value="Domingo">Domingo</option>
              </select>

              <input
                type="text"
                placeholder="Horário"
                value={novoJogo.horario}
                onChange={(e) =>
                  setNovoJogo((prev) => ({ ...prev, horario: e.target.value }))
                }
                style={inputStyle}
              />

              <select
                value={novoJogo.casa}
                onChange={(e) =>
                  setNovoJogo((prev) => ({ ...prev, casa: e.target.value }))
                }
                style={inputStyle}
              >
                <option value="">Time da casa</option>
                {times.map((time) => (
                  <option key={time.id} value={time.nome}>
                    {time.nome}
                  </option>
                ))}
              </select>

              <select
                value={novoJogo.visitante}
                onChange={(e) =>
                  setNovoJogo((prev) => ({ ...prev, visitante: e.target.value }))
                }
                style={inputStyle}
              >
                <option value="">Time visitante</option>
                {times.map((time) => (
                  <option key={time.id} value={time.nome}>
                    {time.nome}
                  </option>
                ))}
              </select>

              <button type="submit" style={primaryButtonStyle}>
                Cadastrar jogo
              </button>
            </form>
          </section>

          <section style={panelStyleFull}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>Jogos cadastrados</h2>
            </div>

            <div style={matchListStyle}>
              {jogos.map((jogo) => (
                <div key={jogo.id} style={scoreboardCardStyle}>
                  <div style={scoreboardHeaderStyle}>
                    <span style={roundPillStyle}>Rodada {jogo.rodada}</span>
                    <span style={flashDateStyle}>{getDataJogo(jogo)}</span>
                  </div>

                  <div style={scoreboardTeamsStyle}>
                    <div style={scoreboardTeamStyle}>{getCasa(jogo)}</div>
                    <div style={scoreboardMiddleStyle}>
                      <div style={versusMiniStyle}>
                        {jogo.finalizado ? "PLACAR" : "VS"}
                      </div>
                      <div style={scheduleTimeStyle}>
                        {jogo.finalizado
                          ? `${Number(jogo.gols_casa || 0)} x ${Number(
                              jogo.gols_visitante || 0
                            )}`
                          : jogo.horario || "-"}
                      </div>
                    </div>
                    <div style={scoreboardTeamStyle}>{getVisitante(jogo)}</div>
                  </div>

                  <div style={cardFooterRowStyle}>
                    <span style={scoreboardFooterStyleInline}>
                      {jogo.dia || "-"} • {jogo.finalizado ? "Finalizado" : "Pendente"}
                    </span>

                    <button
                      onClick={() => excluirJogo(jogo.id)}
                      style={dangerButtonStyle}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}

              {jogos.length === 0 && (
                <div style={emptyCardStyle}>Nenhum jogo cadastrado.</div>
              )}
            </div>
          </section>
        </div>
      )}

      {abaAtiva === "resultados" && (
        <div style={mainGridStyle}>
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>Lançar resultado</h2>
            </div>

            <form onSubmit={lancarResultado} style={formStyle}>
              <select
                value={resultadoJogo.jogo_id}
                onChange={(e) =>
                  setResultadoJogo((prev) => ({ ...prev, jogo_id: e.target.value }))
                }
                style={inputStyle}
              >
                <option value="">Selecione o jogo</option>
                {jogosPendentes.map((jogo) => (
                  <option key={jogo.id} value={jogo.id}>
                    Rodada {jogo.rodada} - {getCasa(jogo)} x {getVisitante(jogo)}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0"
                placeholder="Gols da casa"
                value={resultadoJogo.gols_casa}
                onChange={(e) =>
                  setResultadoJogo((prev) => ({ ...prev, gols_casa: e.target.value }))
                }
                style={inputStyle}
              />

              <input
                type="number"
                min="0"
                placeholder="Gols do visitante"
                value={resultadoJogo.gols_visitante}
                onChange={(e) =>
                  setResultadoJogo((prev) => ({
                    ...prev,
                    gols_visitante: e.target.value,
                  }))
                }
                style={inputStyle}
              />

              <button type="submit" style={primaryButtonStyle}>
                Lançar resultado
              </button>
            </form>
          </section>

          <section style={panelStyleFull}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>Resultados lançados</h2>
            </div>

            <div style={matchListStyle}>
              {jogos.map((jogo) => (
                <div
                  key={jogo.id}
                  style={jogo.finalizado ? resultFlashCardStyle : scoreboardCardStyle}
                >
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

              {jogos.length === 0 && (
                <div style={emptyCardStyle}>Nenhum jogo cadastrado.</div>
              )}
            </div>
          </section>
        </div>
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
                        {i + 1}
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
        <div style={mainGridStyle}>
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
        </div>
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

const alertStyle = {
  background: "rgba(37,99,235,0.12)",
  border: "1px solid #264269",
  color: "#dbeafe",
  padding: "12px 14px",
  borderRadius: "14px",
  marginBottom: "12px",
  fontSize: "14px",
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

const panelStyleFull = {
  ...panelStyle,
  gridColumn: "1 / -1",
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

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const inputStyle = {
  padding: "12px 12px",
  borderRadius: "12px",
  border: "1px solid #334155",
  background: "#0b1425",
  color: "#ffffff",
  fontSize: "14px",
  outline: "none",
};

const primaryButtonStyle = {
  padding: "12px 14px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(90deg, #2563eb, #7c3aed)",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
};

const dangerButtonStyle = {
  padding: "8px 12px",
  borderRadius: "10px",
  border: "none",
  background: "#ef4444",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: "800",
  cursor: "pointer",
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

const scoreboardFooterStyleInline = {
  fontSize: "12px",
  color: "#9fb1cd",
};

const cardFooterRowStyle = {
  marginTop: "12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
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