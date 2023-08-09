import { BallotHashModel, BallotList, BallotModel, RaceModel } from '@/TrueVote.Api';
import { DBGetBallotById } from '@/services/DataClient';
import { Hero } from '@/ui/Hero';
import { Box, Card, Container, Flex, Group, ScrollArea, Stack, Text, Title } from '@mantine/core';
import moment from 'moment';
import { FC } from 'react';
import ReactJson from 'react-json-view';
import { Params, useParams } from 'react-router-dom';

export const BallotView: FC = () => {
  return (
    <Container size='xs' px='xs'>
      <Stack spacing={32}>
        <Hero title='Ballot' />
      </Stack>
      <Ballot />
    </Container>
  );
};

const Ballot: FC = () => {
  const params: Params<string> = useParams();

  const { loading, error, data } = DBGetBallotById(params.ballotId);
  if (loading) return <>Loading Ballot...</>;
  if (error) {
    console.error(error);
    return <>`Error ${error.message}`</>;
  }
  console.info(data);

  const ballotList: BallotList = data!.GetBallotById;
  if (ballotList === null || ballotList === undefined) {
    return (
      <Container size='xs' px='xs'>
        <Text>BallotList Not Found</Text>
      </Container>
    );
  }
  const ballot: BallotModel = ballotList!.Ballots![0];
  if (ballot === null || ballot === undefined) {
    return (
      <Container size='xs' px='xs'>
        <Text>Ballot Not Found</Text>
      </Container>
    );
  }
  const ballotHash: BallotHashModel = ballotList!.BallotHashes![0];

  const races: any = ballot.Election?.Races?.map((e: RaceModel) => (
    <Text key={e.RaceId}>{e.Name}</Text>
  ));

  return (
    <Container size='xs' px='xs'>
      <Title size='h3'>{ballot.Election?.Name}</Title>
      <Card shadow='sm' p='lg' radius='md' withBorder>
        Submitted: {moment(ballot.DateCreated).format('MMMM DD, YYYY, HH:MM:SS')}
      </Card>
      <Card shadow='sm' p='lg' radius='md' withBorder>
        <Group position='center' spacing='xl' grow>
          <Card.Section>
            <Flex
              miw='50'
              bg='rgba(0, 0, 0, .3)'
              gap='sm'
              justify='flex-start'
              align='flex-start'
              direction='column'
              wrap='nowrap'
            >
              <Box sx={(): any => ({ height: '5px' })}></Box>
              {races}
              <Box sx={(): any => ({ height: '5px' })}></Box>
            </Flex>
          </Card.Section>
        </Group>
        <Group position='apart' mt='md' mb='xs'>
          <ScrollArea>
            <Text size='xs'>
              <div>
                <ReactJson src={ballot} name='Ballot' collapsed={true} theme='monokai' />
              </div>
            </Text>
          </ScrollArea>
        </Group>
        <Group position='apart' mt='md' mb='xs'>
          <ScrollArea>
            <Text size='xs'>
              <div>
                <ReactJson src={ballotHash} name='BallotHash' collapsed={true} theme='monokai' />
              </div>
            </Text>
          </ScrollArea>
        </Group>
      </Card>
    </Container>
  );
};
