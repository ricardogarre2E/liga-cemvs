import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://yqauqfifqpnbuttxeznr.supabase.co",
  "sb_publishable_tXRPmZF6HAsgrHKnTA6itg_w0I1miJB"
);

export default function AppAdmin() {
  const [jogos, setJogos] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState("jogos");
  const [busca, setBusca] = useState("");

  const [jogadores, setJogadores] = useState(() => {
    const salvo = localStorage.getItem("jogadores_cemvs");
    return salvo ? JSON.parse(salvo) : [];
  });

  const [lancamentosGols, setLancamentosGols] = useState(() => {
    const salvo = localStorage.getItem("lancamentos_gols_cemvs");
    return salvo ? JSON.parse(salvo) : [];
  });

  const [lancamentosCartoes, setLancamentosCartoes] = useState(() => {
    const salvo = localStorage.getItem("lancamentos_cartoes_cemvs");
    return salvo ? JSON.parse(salvo) : [];
  });

  const [nomeJogador, setNomeJogador] = useState("");
  const [timeJogador, setTimeJogador] = useState("");

  const [jogadorGolId, setJogadorGolId] = useState("");
  const [qtdGols, setQtdGols] = useState("");

  const [jogadorCartaoId, setJogadorCartaoId] = useState("");
  const [qtdAmarelos, setQtdAmarelos] = useState("");
  const [qtdVermelhos, setQtdVermelhos] = useState("");

  async function carregarJogos() {
    const { data, error } = await supabase
      .from("jogos_cemvs")
      .select("*")
      .order("id");

    if (error) {
      console.error("Erro ao carregar jogos:", error);
      setJogos([]);
      return;
    }

    const jogosUnicos = [];
    const confrontos = new Set();

    (data || []).forEach((jogo) => {
      const chave1 = `${jogo.casa}-${jogo.fora}`;
      const chave2 = `${jogo.fora}-${jogo.casa}`;

      if (!confrontos.has(chave1) && !confrontos.has(chave2)) {
        confrontos.add(chave1);
        jogosUnicos.push(jogo);
      }
    });

    setJogos(jogosUnicos);
  }

  async function atualizarResultado(id, golsCasa, golsFora) {
    const golsCasaCorrigido =
      golsCasa === null || golsCasa === "" ? null : Math.max(0, Number(golsCasa));

    const golsForaCorrigido =
      golsFora === null || golsFora === "" ? null : Math.max(0, Number(golsFora));

    const { error } = await supabase
      .from("jogos_cemvs")
      .update({
        gols_casa: golsCasaCorrigido,
        gols_fora: golsForaCorrigido,
      })
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar resultado:", error);
      return;
    }

    carregarJogos();
  }

  useEffect(() => {
    carregarJogos();
  }, []);

  useEffect(() => {
    localStorage.setItem("jogadores_cemvs", JSON.stringify(jogadores));
  }, [jogadores]);

  useEffect(() => {
    localStorage.setItem("lancamentos_gols_cemvs", JSON.stringify(lancamentosGols));
  }, [lancamentosGols]);

  useEffect(() => {
    localStorage.setItem("lancamentos_cartoes_cemvs", JSON.stringify(lancamentosCartoes));
  }, [lancamentosCartoes]);

  const times = useMemo(() => {
    const lista = new Set();
    jogos.forEach((jogo) => {
      lista.add(jogo.casa);
      lista.add(jogo.fora);
    });
    return Array.from(lista).sort();
  }, [jogos]);

  const jogosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return jogos;

    return jogos.filter(
      (jogo) =>
        String(jogo.rodada || "").includes(q) ||
        String(jogo.data || "").toLowerCase().includes(q) ||
        String(jogo.casa || "").toLowerCase().includes(q) ||
        String(jogo.fora || "").toLowerCase().includes(q)
    );
  }, [jogos, busca]);

  const classificacao = useMemo(() => {
    const tabela = {};

    jogos.forEach((jogo) => {
      const casa = jogo.casa;
      const fora = jogo.fora;

      if (!tabela[casa]) {
        tabela[casa] = { time: casa, pts: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0 };
      }
      if (!tabela[fora]) {
        tabela[fora] = { time: fora, pts: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0 };
      }

      const golsCasa = jogo.gols_casa;
      const golsFora = jogo.gols_fora;

      if (
        golsCasa === null ||
        golsCasa === "" ||
        golsFora === null ||
        golsFora === ""
      ) {
        return;
      }

      tabela[casa].j += 1;
      tabela[fora].j += 1;

      tabela[casa].gp += Number(golsCasa);
      tabela[casa].gc += Number(golsFora);
      tabela[fora].gp += Number(golsFora);
      tabela[fora].gc += Number(golsCasa);

      if (Number(golsCasa) > Number(golsFora)) {
        tabela[casa].v += 1;
        tabela[casa].pts += 3;
        tabela[fora].d += 1;
      } else if (Number(golsCasa) < Number(golsFora)) {
        tabela[fora].v += 1;
        tabela[fora].pts += 3;
        tabela[casa].d += 1;
      } else {
        tabela[casa].e += 1;
        tabela[fora].e += 1;
        tabela[casa].pts += 1;
        tabela[fora].pts += 1;
      }
    });

    return Object.values(tabela)
      .map((item) => ({ ...item, sg: item.gp - item.gc }))
      .sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.sg !== a.sg) return b.sg - a.sg;
        if (b.gp !== a.gp) return b.gp - a.gp;
        return a.time.localeCompare(b.time);
      });
  }, [jogos]);

  const jogadoresComStats = useMemo(() => {
    return jogadores
      .map((jogador) => {
        const gols = lancamentosGols
          .filter((item) => item.jogadorId === jogador.id)
          .reduce((acc, item) => acc + Number(item.gols || 0), 0);

        const amarelos = lancamentosCartoes
          .filter((item) => item.jogadorId === jogador.id)
          .reduce((acc, item) => acc + Number(item.amarelos || 0), 0);

        const vermelhos = lancamentosCartoes
          .filter((item) => item.jogadorId === jogador.id)
          .reduce((acc, item) => acc + Number(item.vermelhos || 0), 0);

        return {
          ...jogador,
          gols,
          amarelos,
          vermelhos,
          situacao: amarelos >= 3 ? "Suspenso" : "Liberado",
        };
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [jogadores, lancamentosGols, lancamentosCartoes]);

  const rankingArtilheiros = useMemo(() => {
    return [...jogadoresComStats]
      .filter((j) => j.gols > 0)
      .sort((a, b) => {
        if (b.gols !== a.gols) return b.gols - a.gols;
        return a.nome.localeCompare(b.nome);
      });
  }, [jogadoresComStats]);

  const rankingCartoes = useMemo(() => {
    return [...jogadoresComStats]
      .filter((j) => j.amarelos > 0 || j.vermelhos > 0)
      .sort((a, b) => {
        if (b.amarelos !== a.amarelos) return b.amarelos - a.amarelos;
        if (b.vermelhos !== a.vermelhos) return b.vermelhos - a.vermelhos;
        return a.nome.localeCompare(b.nome);
      });
  }, [jogadoresComStats]);

  function adicionarJogador() {
    if (!nomeJogador || !timeJogador) return;

    const existe = jogadores.some(
      (j) =>
        j.nome.trim().toLowerCase() === nomeJogador.trim().toLowerCase() &&
        j.time === timeJogador
    );

    if (existe) {
      alert("Esse jogador já está cadastrado nesse time.");
      return;
    }

    setJogadores((prev) => [
      ...prev,
      { id: Date.now(), nome: nomeJogador.trim(), time: timeJogador },
    ]);

    setNomeJogador("");
    setTimeJogador("");
  }

  function removerJogador(id) {
    setJogadores((prev) => prev.filter((j) => j.id !== id));
    setLancamentosGols((prev) => prev.filter((l) => l.jogadorId !== id));
    setLancamentosCartoes((prev) => prev.filter((l) => l.jogadorId !== id));
  }

  function lancarGols() {
    if (!jogadorGolId || qtdGols === "") return;

    setLancamentosGols((prev) => [
      ...prev,
      {
        id: Date.now(),
        jogadorId: Number(jogadorGolId),
        gols: Math.max(0, Number(qtdGols)),
      },
    ]);

    setJogadorGolId("");
    setQtdGols("");
  }

  function lancarCartoes() {
    if (!jogadorCartaoId) return;

    setLancamentosCartoes((prev) => [
      ...prev,
      {
        id: Date.now(),
        jogadorId: Number(jogadorCartaoId),
        amarelos: qtdAmarelos === "" ? 0 : Math.max(0, Number(qtdAmarelos)),
        vermelhos: qtdVermelhos === "" ? 0 : Math.max(0, Number(qtdVermelhos)),
      },
    ]);

    setJogadorCartaoId("");
    setQtdAmarelos("");
    setQtdVermelhos("");
  }

  const jogosConcluidos = jogos.filter(
    (j) =>
      j.gols_casa !== null &&
      j.gols_casa !== "" &&
      j.gols_fora !== null &&
      j.gols_fora !== ""
  ).length;

  const lider = classificacao[0]?.time || "-";
  const artilheiro = rankingArtilheiros[0]?.nome || "-";

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        <Cabecalho lider={lider} jogosConcluidos={jogosConcluidos} totalJogos={jogos.length} artilheiro={artilheiro} />

        <div style={styles.tabs}>
          <TabButton label="Jogos" active={abaAtiva === "jogos"} onClick={() => setAbaAtiva("jogos")} />
          <TabButton label="Classificação" active={abaAtiva === "classificacao"} onClick={() => setAbaAtiva("classificacao")} />
          <TabButton label="Jogadores" active={abaAtiva === "jogadores"} onClick={() => setAbaAtiva("jogadores")} />
          <TabButton label="Artilheiros" active={abaAtiva === "artilheiros"} onClick={() => setAbaAtiva("artilheiros")} />
          <TabButton label="Cartões" active={abaAtiva === "cartoes"} onClick={() => setAbaAtiva("cartoes")} />
        </div>

        {abaAtiva === "jogos" && (
          <SectionCard title="📅 Jogos">
            <div style={styles.searchRow}>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por time, data ou rodada"
                style={styles.searchInput}
              />
            </div>

            <div style={styles.stack}>
              {jogosFiltrados.map((jogo) => (
                <div key={jogo.id} style={styles.jogoCard}>
                  <div style={styles.rodadaBox}>Rod. {jogo.rodada}</div>
                  <div style={styles.dataBox}>{jogo.data}</div>
                  <div style={styles.confrontoBox}>
                    {jogo.casa} <span style={{ color: "#ffd54a" }}>vs</span> {jogo.fora}
                  </div>

                  <input
                    type="number"
                    min="0"
                    placeholder="Casa"
                    value={jogo.gols_casa ?? ""}
                    onChange={(e) =>
                      atualizarResultado(
                        jogo.id,
                        e.target.value === "" ? null : e.target.value,
                        jogo.gols_fora
                      )
                    }
                    style={styles.placarInput}
                  />

                  <input
                    type="number"
                    min="0"
                    placeholder="Fora"
                    value={jogo.gols_fora ?? ""}
                    onChange={(e) =>
                      atualizarResultado(
                        jogo.id,
                        jogo.gols_casa,
                        e.target.value === "" ? null : e.target.value
                      )
                    }
                    style={styles.placarInput}
                  />
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {abaAtiva === "classificacao" && (
          <SectionCard title="🏆 Classificação">
            <TabelaClassificacao classificacao={classificacao} />
          </SectionCard>
        )}

        {abaAtiva === "jogadores" && (
          <div style={styles.twoCol}>
            <SectionCard title="👥 Cadastro de jogadores">
              <div style={styles.formGrid}>
                <input
                  value={nomeJogador}
                  onChange={(e) => setNomeJogador(e.target.value)}
                  placeholder="Nome do jogador"
                  style={styles.bigInput}
                />
                <select
                  value={timeJogador}
                  onChange={(e) => setTimeJogador(e.target.value)}
                  style={styles.bigInput}
                >
                  <option value="">Selecione o time</option>
                  {times.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <button style={styles.primaryButton} onClick={adicionarJogador}>
                  Adicionar jogador
                </button>
              </div>
            </SectionCard>

            <SectionCard title="📋 Elenco geral">
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Jogador</th>
                      <th style={styles.th}>Time</th>
                      <th style={styles.th}>Gols</th>
                      <th style={styles.th}>Amarelos</th>
                      <th style={styles.th}>Vermelhos</th>
                      <th style={styles.th}>Situação</th>
                      <th style={styles.th}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jogadoresComStats.map((jogador) => (
                      <tr key={jogador.id}>
                        <td style={styles.tdLeft}>{jogador.nome}</td>
                        <td style={styles.td}>{jogador.time}</td>
                        <td style={styles.td}>{jogador.gols}</td>
                        <td style={styles.td}>{jogador.amarelos}</td>
                        <td style={styles.td}>{jogador.vermelhos}</td>
                        <td style={styles.td}>
                          <span style={jogador.situacao === "Suspenso" ? styles.badgeRed : styles.badgeGreen}>
                            {jogador.situacao}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button style={styles.dangerButton} onClick={() => removerJogador(jogador.id)}>
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

        {abaAtiva === "artilheiros" && (
          <div style={styles.twoCol}>
            <SectionCard title="⚽ Lançar gols">
              <div style={styles.formGrid}>
                <select
                  value={jogadorGolId}
                  onChange={(e) => setJogadorGolId(e.target.value)}
                  style={styles.bigInput}
                >
                  <option value="">Selecione o jogador</option>
                  {jogadoresComStats.map((jogador) => (
                    <option key={jogador.id} value={jogador.id}>
                      {jogador.nome} - {jogador.time}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  value={qtdGols}
                  onChange={(e) => setQtdGols(e.target.value)}
                  placeholder="Quantidade de gols"
                  style={styles.bigInput}
                />

                <button style={styles.primaryButton} onClick={lancarGols}>
                  Adicionar gols
                </button>
              </div>
            </SectionCard>

            <SectionCard title="🥇 Ranking de artilheiros">
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Jogador</th>
                      <th style={styles.th}>Time</th>
                      <th style={styles.th}>Gols</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingArtilheiros.map((jogador, index) => (
                      <tr key={jogador.id}>
                        <td style={styles.tdStrong}>{index + 1}</td>
                        <td style={styles.tdLeft}>{jogador.nome}</td>
                        <td style={styles.td}>{jogador.time}</td>
                        <td style={styles.td}>{jogador.gols}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

        {abaAtiva === "cartoes" && (
          <div style={styles.twoCol}>
            <SectionCard title="🟨 Lançar cartões">
              <div style={styles.formGrid}>
                <select
                  value={jogadorCartaoId}
                  onChange={(e) => setJogadorCartaoId(e.target.value)}
                  style={styles.bigInput}
                >
                  <option value="">Selecione o jogador</option>
                  {jogadoresComStats.map((jogador) => (
                    <option key={jogador.id} value={jogador.id}>
                      {jogador.nome} - {jogador.time}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  value={qtdAmarelos}
                  onChange={(e) => setQtdAmarelos(e.target.value)}
                  placeholder="Amarelos"
                  style={styles.bigInput}
                />

                <input
                  type="number"
                  min="0"
                  value={qtdVermelhos}
                  onChange={(e) => setQtdVermelhos(e.target.value)}
                  placeholder="Vermelhos"
                  style={styles.bigInput}
                />

                <button style={styles.primaryButton} onClick={lancarCartoes}>
                  Adicionar cartões
                </button>
              </div>
            </SectionCard>

            <SectionCard title="🛡️ Controle disciplinar">
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Jogador</th>
                      <th style={styles.th}>Time</th>
                      <th style={styles.th}>Amarelos</th>
                      <th style={styles.th}>Vermelhos</th>
                      <th style={styles.th}>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingCartoes.map((jogador) => (
                      <tr key={jogador.id}>
                        <td style={styles.tdLeft}>{jogador.nome}</td>
                        <td style={styles.td}>{jogador.time}</td>
                        <td style={styles.td}>{jogador.amarelos}</td>
                        <td style={styles.td}>{jogador.vermelhos}</td>
                        <td style={styles.td}>
                          <span style={jogador.situacao === "Suspenso" ? styles.badgeRed : styles.badgeGreen}>
                            {jogador.situacao}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}

function Cabecalho({ lider, jogosConcluidos, totalJogos, artilheiro }) {
  return (
    <div style={styles.topGrid}>
      <div style={styles.hero}>
        <div style={styles.heroLeft}>
          <div style={styles.logoBox}>
            <img src="/cemvs-logo.png" alt="CEMVS" style={styles.logo} />
          </div>
          <div style={styles.heroTextBox}>
            <h1 style={styles.title}>Liga de Futsal CEMVS 2026</h1>
            <p style={styles.subtitle}>
              Painel oficial do campeonato com jogos, classificação, artilheiros e cartões.
            </p>
          </div>
        </div>

        <div style={styles.heroBadge}>
          <div style={styles.heroBadgeSmall}>Colégio Estadual</div>
          <div style={styles.heroBadgeTitle}>Manoel Vicente de Souza</div>
          <div style={styles.heroBadgeSmall}>CEMVS • 45 anos</div>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <StatCard title="Líder" value={lider} emoji="🏆" />
        <StatCard title="Jogos concluídos" value={`${jogosConcluidos}/${totalJogos}`} emoji="📅" />
        <StatCard title="Artilheiro" value={artilheiro} emoji="🥇" />
        <StatCard title="Suspensão" value="3 amarelos" emoji="🟨" />
      </div>
    </div>
  );
}

function TabelaClassificacao({ classificacao }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>#</th>
            <th style={styles.th}>Time</th>
            <th style={styles.th}>P</th>
            <th style={styles.th}>J</th>
            <th style={styles.th}>V</th>
            <th style={styles.th}>E</th>
            <th style={styles.th}>D</th>
            <th style={styles.th}>GP</th>
            <th style={styles.th}>GC</th>
            <th style={styles.th}>SG</th>
          </tr>
        </thead>
        <tbody>
          {classificacao.map((time, index) => (
            <tr key={time.time}>
              <td style={styles.tdStrong}>{index + 1}</td>
              <td style={styles.tdLeft}>{time.time}</td>
              <td style={styles.td}>{time.pts}</td>
              <td style={styles.td}>{time.j}</td>
              <td style={styles.td}>{time.v}</td>
              <td style={styles.td}>{time.e}</td>
              <td style={styles.td}>{time.d}</td>
              <td style={styles.td}>{time.gp}</td>
              <td style={styles.td}>{time.gc}</td>
              <td style={styles.td}>{time.sg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ title, value, emoji }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{emoji}</div>
      <div style={styles.statTitle}>{title}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={active ? styles.tabActive : styles.tab}>
      {label}
    </button>
  );
}

function SectionCard({ title, children }) {
  return (
    <div style={styles.sectionCard}>
      <div style={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #082c24 0%, #111111 45%, #3b2a00 100%)",
    color: "#ffffff",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "16px",
  },
  topGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "20px",
    marginBottom: "24px",
  },
  hero: {
    background:
      "linear-gradient(90deg, #0b8a6a 0%, #0f6f5a 45%, #d5a820 100%)",
    borderRadius: "28px",
    padding: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
    flexWrap: "wrap",
  },
  heroLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  heroTextBox: {
    minWidth: "220px",
    flex: 1,
  },
  logoBox: {
    width: "84px",
    height: "84px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backdropFilter: "blur(8px)",
    flexShrink: 0,
  },
  logo: {
    width: "66px",
    height: "66px",
    objectFit: "contain",
  },
  title: {
    fontSize: "clamp(32px, 7vw, 52px)",
    margin: 0,
    fontWeight: 900,
    lineHeight: 1.05,
  },
  subtitle: {
    marginTop: "10px",
    marginBottom: 0,
    fontSize: "15px",
    color: "rgba(255,255,255,0.92)",
  },
  heroBadge: {
    background: "rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: "24px",
    padding: "16px 18px",
    minWidth: "220px",
    width: "100%",
    maxWidth: "320px",
  },
  heroBadgeSmall: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: "rgba(255,255,255,0.82)",
  },
  heroBadgeTitle: {
    fontSize: "18px",
    fontWeight: 800,
    margin: "6px 0",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },
  statCard: {
    background: "rgba(10,10,10,0.82)",
    border: "1px solid #262626",
    borderRadius: "24px",
    padding: "18px",
    boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
  },
  statIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "16px",
    background: "rgba(11,138,106,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    marginBottom: "10px",
  },
  statTitle: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: "#b7b7b7",
  },
  statValue: {
    marginTop: "8px",
    fontSize: "clamp(22px, 5vw, 26px)",
    fontWeight: 900,
    wordBreak: "break-word",
  },
  tabs: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "24px",
    background: "rgba(15,15,15,0.78)",
    border: "1px solid #2a2a2a",
    borderRadius: "22px",
    padding: "8px",
  },
  tab: {
    padding: "12px 16px",
    background: "transparent",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 700,
    flexGrow: 1,
    minWidth: "120px",
  },
  tabActive: {
    padding: "12px 16px",
    background: "#0d8b6a",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 700,
    boxShadow: "0 8px 20px rgba(13,139,106,0.35)",
    flexGrow: 1,
    minWidth: "120px",
  },
  sectionCard: {
    background: "rgba(10,10,10,0.78)",
    border: "1px solid #262626",
    borderRadius: "28px",
    padding: "18px",
    boxShadow: "0 14px 40px rgba(0,0,0,0.28)",
  },
  sectionTitle: {
    fontSize: "clamp(24px, 5vw, 28px)",
    fontWeight: 900,
    marginBottom: "18px",
  },
  searchRow: {
    marginBottom: "18px",
  },
  searchInput: {
    width: "100%",
    maxWidth: "100%",
    padding: "12px 14px",
    borderRadius: "16px",
    border: "1px solid #3a3a3a",
    background: "#171717",
    color: "#fff",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  stack: {
    display: "grid",
    gap: "12px",
  },
  jogoCard: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px",
    alignItems: "center",
    padding: "16px",
    background: "rgba(24,24,24,0.9)",
    border: "1px solid #2c2c2c",
    borderRadius: "20px",
  },
  rodadaBox: {
    fontSize: "14px",
    color: "#b5b5b5",
  },
  dataBox: {
    fontSize: "14px",
    color: "#d8d8d8",
  },
  confrontoBox: {
    fontSize: "clamp(22px, 5vw, 26px)",
    fontWeight: 800,
    letterSpacing: "0.02em",
  },
  placarInput: {
    width: "100%",
    padding: "12px",
    borderRadius: "14px",
    border: "1px solid #3a3a3a",
    background: "rgba(0,0,0,0.35)",
    color: "#fff",
    textAlign: "center",
    fontSize: "20px",
    boxSizing: "border-box",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "20px",
  },
  formGrid: {
    display: "grid",
    gap: "12px",
  },
  bigInput: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "16px",
    border: "1px solid #3a3a3a",
    background: "#171717",
    color: "#fff",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  primaryButton: {
    padding: "13px 16px",
    border: "none",
    borderRadius: "16px",
    background: "#0d8b6a",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
    width: "100%",
  },
  dangerButton: {
    padding: "9px 14px",
    border: "none",
    borderRadius: "12px",
    background: "#c93636",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid #2c2c2c",
    borderRadius: "20px",
  },
  table: {
    width: "100%",
    minWidth: "700px",
    borderCollapse: "collapse",
    background: "#161616",
  },
  th: {
    padding: "14px 12px",
    background: "#202020",
    borderBottom: "1px solid #343434",
    fontSize: "15px",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px 12px",
    borderBottom: "1px solid #2d2d2d",
    fontSize: "15px",
    textAlign: "center",
  },
  tdLeft: {
    padding: "14px 12px",
    borderBottom: "1px solid #2d2d2d",
    fontSize: "15px",
    textAlign: "left",
  },
  tdStrong: {
    padding: "14px 12px",
    borderBottom: "1px solid #2d2d2d",
    fontSize: "15px",
    textAlign: "center",
    fontWeight: 900,
    color: "#ffd54a",
  },
  badgeRed: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(220,53,69,0.2)",
    color: "#ffb7bf",
    fontSize: "12px",
    fontWeight: 800,
  },
  badgeGreen: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(13,139,106,0.2)",
    color: "#9bf0d3",
    fontSize: "12px",
    fontWeight: 800,
  },
};