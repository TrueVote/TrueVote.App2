import { CandidateResult, ElectionModel, ElectionResults } from '@/TrueVote.Api';
import { DBGetElectionById, DBGetElectionResultsById } from '@/services/GraphQLDataClient';
import { TrueVoteLoader } from '@/ui/CustomLoader';
import { Hero } from '@/ui/Hero';
import classes from '@/ui/shell/AppStyles.module.css';
import { useApolloClient } from '@apollo/client';
import {
  Box,
  Card,
  Container,
  Group,
  ScrollArea,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { FC, useEffect, useMemo, useState } from 'react';
import ReactJson from 'react-json-view';
import { Params, useParams } from 'react-router-dom';
import { Cell, Pie, PieChart } from 'recharts';

// eslint-disable-next-line no-unused-vars
const useChartColors = (): ((index: number) => string) => {
  const COLORS = [
    '#6277b7',
    '#21b371',
    '#d97757',
    '#1c2336',
    '#fddb33',
    '#6A0DAD',
    '#1E90FF',
    '#32CD32',
    '#FFD700',
    '#FF69B4',
    '#20B2AA',
    '#BA55D3',
  ];
  return (_index: number) => COLORS[_index % COLORS.length];
};

const groupSmallSlices = (data: CandidateResult[], threshold: number): CandidateResult[] => {
  const totalVotes = data.reduce((sum, item) => sum + item.TotalVotes, 0);
  return data.reduce((acc, item) => {
    if (item.TotalVotes / totalVotes < threshold) {
      const otherIndex = acc.findIndex((i) => i.CandidateName === 'Other');
      if (otherIndex !== -1) {
        acc[otherIndex].TotalVotes += item.TotalVotes;
      } else {
        acc.push({ CandidateName: 'Other', TotalVotes: item.TotalVotes, CandidateId: '' });
      }
    } else {
      acc.push(item);
    }
    return acc;
  }, [] as CandidateResult[]);
};

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
  value,
  partyAffiliation,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
  value: number;
  partyAffiliation: string;
}): JSX.Element => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const cos = Math.cos(-midAngle * RADIAN);
  const isLeftSide = cos < 0;
  const textAnchor = isLeftSide ? 'end' : 'start';
  const xOffset = isLeftSide ? -5 : 5;

  // More aggressive text wrapping function
  const wrapText = (text: string, maxLength: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    words.forEach((word) => {
      if (currentLine.length + word.length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const nameLines = wrapText(name, 10); // More aggressive wrapping
  const percentText = `${(percent * 100).toFixed(0)}%`;
  const voteText = `${value} Vote${value !== 1 ? 's' : ''}`;

  return (
    <text x={x + xOffset} y={y} fill='white' textAnchor={textAnchor} dominantBaseline='central'>
      {nameLines.map((line, i) => (
        <tspan
          x={x + xOffset}
          dy={i === 0 ? `-${(nameLines.length - 1) * 18}` : 20}
          key={i}
          fontSize='16px'
          fontWeight='bold'
        >
          {line}
        </tspan>
      ))}
      <tspan x={x + xOffset} dy='22' fontSize='12px' fontStyle='italic'>
        {partyAffiliation}
      </tspan>
      <tspan x={x + xOffset} dy='20' fontSize='14px'>
        {voteText}
      </tspan>
      <tspan x={x + xOffset} dy='20' fontSize='14px'>
        {percentText}
      </tspan>
    </text>
  );
};
export const Results: FC = () => {
  const { colorScheme } = useMantineColorScheme();
  const apolloClient = useApolloClient();
  const params: Params<string> = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [electionResults, setElectionResult] = useState<ElectionResults | undefined>();
  const [electionDetails, setElectionDetails] = useState<ElectionModel | undefined>();
  const getColor: () => 'monokai' | 'rjv-default' = () =>
    colorScheme === 'dark' ? 'monokai' : 'rjv-default';
  const colorIndex = useChartColors();

  // Pre-process the data once electionResults are available
  const processedRaces = useMemo(() => {
    if (!electionResults || !electionDetails) return [];
    return electionResults.Races.map((race) => {
      const raceDetails = electionDetails.Races.find((r) => r.RaceId === race.RaceId);
      const groupedCandidates = groupSmallSlices(race.CandidateResults, 0.05);
      const totalVotes = race.CandidateResults.reduce(
        (sum, candidate) => sum + candidate.TotalVotes,
        0,
      );
      return {
        ...race,
        totalVotes,
        groupedCandidates: groupedCandidates.map((c) => {
          const candidateDetails = raceDetails?.Candidates.find(
            (cd) => cd.CandidateId === c.CandidateId,
          );
          return {
            ...c,
            PartyAffiliation: candidateDetails?.PartyAffiliation ?? '',
          };
        }),
      };
    });
  }, [electionResults, electionDetails]);

  useEffect(() => {
    const fetchResults = async (): Promise<void> => {
      try {
        const fetchedResults: ElectionResults = await DBGetElectionResultsById(
          apolloClient,
          params.electionId!,
        );

        setElectionResult(fetchedResults);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        setLoading(false);
      }
    };
    fetchResults();
  }, [apolloClient, params.electionId]);

  useEffect(() => {
    const fetchElectionDetails = async (): Promise<void> => {
      try {
        const fetchedElectionDetails: ElectionModel[] = await DBGetElectionById(
          apolloClient,
          params.electionId!,
        );

        setElectionDetails(fetchedElectionDetails[0]);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        setLoading(false);
      }
    };
    fetchElectionDetails();
  }, [apolloClient, params.electionId]);

  if (loading) {
    return <TrueVoteLoader />;
  }

  if (error) {
    console.error(error);
    return <>`Error ${error.message}`</>;
  }

  if (electionResults === undefined) {
    return (
      <Container size='xs' px='xs' className={classes.container}>
        <Text>Election Results Not Found</Text>
      </Container>
    );
  }

  return (
    <Container size='xs' px='xs' className={classes.container}>
      <Hero title='Results' />
      <Text size='xl'>{electionDetails?.Name}</Text>
      <Text size='l'>Total Ballots Submitted: {electionResults.TotalBallots}</Text>
      <Box className={classes.boxGap} />
      <Stack gap='md'>
        {processedRaces.map((r) => (
          <Card shadow='sm' p='lg' radius='md' padding='xl' withBorder key={r.RaceId}>
            <Title className={classes.titleSpaces} size='h4'>
              {r.RaceName}: {r.totalVotes} Vote{r.totalVotes !== 1 ? 's' : ''}{' '}
            </Title>
            <PieChart width={380} height={380}>
              <Pie
                data={r.groupedCandidates.map((c) => ({
                  name: c.CandidateName,
                  value: c.TotalVotes,
                  partyAffiliation: c.PartyAffiliation,
                }))}
                cx='50%'
                cy='50%'
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={190}
                fill='#8884d8'
                dataKey='value'
              >
                {r.groupedCandidates.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colorIndex(index)} />
                ))}
              </Pie>
            </PieChart>
          </Card>
        ))}
      </Stack>
      <Card shadow='sm' p='lg' radius='md' padding='none' withBorder>
        <Title className={classes.titleSpaces} size='h4'>
          Raw Data
        </Title>
        <Group mt='md' mb='xs'>
          <ScrollArea className={classes.rawJson}>
            <ReactJson
              src={electionResults}
              name='Election Results'
              collapsed={true}
              theme={getColor()}
            />
          </ScrollArea>
        </Group>
      </Card>
    </Container>
  );
};
