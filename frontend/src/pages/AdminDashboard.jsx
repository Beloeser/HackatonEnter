import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import styled from 'styled-components'
import {
  getDashboardAnalytics,
  getCaseComparisons,
} from '../services/api'
import AdminSidebar from './admin/components/AdminSidebar'
import AdminTopbar from './admin/components/AdminTopbar'
import AnalyticsCards from './admin/components/AnalyticsCards'
import CaseComparisonTable from './admin/components/CaseComparisonTable'
import DecisionDistributionChart from './admin/components/DecisionDistributionChart'

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  grid-template-rows: 96px minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #f3f4f6;
`

const MainContent = styled.div`
  grid-column: 2;
  grid-row: 2;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
`

const ScrollableContent = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 28px 32px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #e5e7eb;
  }

  &::-webkit-scrollbar-thumb {
    background: #9ca3af;
    border-radius: 4px;

    &:hover {
      background: #6b7280;
    }
  }
`

const SectionTitle = styled.h2`
  margin: 28px 0 14px;
  color: #111827;
  font-size: 18px;
  font-weight: 600;

  &:first-child {
    margin-top: 0;
  }
`

const SectionDescription = styled.p`
  margin: -4px 0 14px;
  color: #6b7280;
  font-size: 13px;
`

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 28px;
`

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  height: 280px;
  color: #6b7280;
  font-size: 16px;
`

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fef2f2;
  color: #991b1b;
`

function AdminDashboard() {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [comparisonsData, setComparisonsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [analytics, comparisons] = await Promise.all([
          getDashboardAnalytics(),
          getCaseComparisons(),
        ])

        setAnalyticsData(analytics.data)
        setComparisonsData(comparisons.data)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Erro ao carregar dados do dashboard. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <DashboardContainer>
        <AdminSidebar />
        <AdminTopbar />
        <MainContent>
          <ScrollableContent>
            <LoadingContainer>Carregando dados...</LoadingContainer>
          </ScrollableContent>
        </MainContent>
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer>
      <AdminSidebar />
      <AdminTopbar />
      <MainContent>
        <ScrollableContent>
          {error && (
            <ErrorContainer>
              <AlertCircle size={20} />
              {error}
            </ErrorContainer>
          )}

          {analyticsData && (
            <>
              <SectionTitle>Resumo Executivo</SectionTitle>
              <SectionDescription>Visao rapida para priorizar a operacao do time juridico.</SectionDescription>
              <AnalyticsCards data={analyticsData} />
            </>
          )}

          {analyticsData && (
            <>
              <SectionTitle>Distribuicao das Decisoes</SectionTitle>
              <SectionDescription>Como os desfechos estao se dividindo entre acordo, defesa e pendencia.</SectionDescription>
              <ChartsGrid>
                <DecisionDistributionChart data={analyticsData.casesByDecision} />
              </ChartsGrid>
            </>
          )}

          {comparisonsData && (
            <>
              <SectionTitle>Detalhamento dos Processos</SectionTitle>
              <SectionDescription>
                Analise caso a caso para investigar convergencias, divergencias e pendencias.
              </SectionDescription>
              <CaseComparisonTable data={comparisonsData} />
            </>
          )}
        </ScrollableContent>
      </MainContent>
    </DashboardContainer>
  )
}

export default AdminDashboard
