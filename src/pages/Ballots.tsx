import { useGlobalContext } from '@/Global';
import { BallotList } from '@/TrueVote.Api';
import { BallotBinder, BallotBinderStorage } from '@/services/BallotBinder';
import { DBGetBallotById } from '@/services/GraphQLDataClient';
import { TrueVoteLoader } from '@/ui/CustomLoader';
import { Hero } from '@/ui/Hero';
import classes from '@/ui/shell/AppStyles.module.css';
import { useApolloClient } from '@apollo/client';
import {
  Accordion,
  Button,
  Container,
  MantineTheme,
  Table,
  Text,
  rem,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { IconChecklist, IconChevronRight, IconZoomIn } from '@tabler/icons-react';
import moment from 'moment';
import { FC, Fragment, ReactElement, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const Ballots: FC = () => {
  const theme: MantineTheme = useMantineTheme();
  const { userModel } = useGlobalContext();
  const apolloClient = useApolloClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [ballotListArray, setBallotListArray] = useState<BallotList[]>([]);
  const ballotBinderStorage: BallotBinderStorage = new BallotBinderStorage(userModel?.UserId ?? '');

  useEffect(() => {
    const fetchBallotListArray = async (): Promise<void> => {
      const ballotBinders: BallotBinder[] = ballotBinderStorage.getAllBallotBinders();
      try {
        const fetchedBallotListArray: BallotList[] = await Promise.all(
          ballotBinders.map(async (binder: BallotBinder) => {
            const ballotList: BallotList = await DBGetBallotById(apolloClient, binder.BallotId);
            return ballotList;
          }),
        );

        setBallotListArray(fetchedBallotListArray);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        setLoading(false);
      }
    };
    fetchBallotListArray();
  }, []);

  if (loading) {
    return <TrueVoteLoader />;
  }
  if (error) {
    console.error(error);
    return <>`Error ${error.message}`</>;
  }
  console.info(ballotListArray);

  return (
    <Container size='xs' px='xs' className={classes.container}>
      <Hero title='Ballots' />
      <AllBallots theme={theme} ballots={ballotListArray} />
    </Container>
  );
};

export const AllBallots: React.FC<{
  theme: MantineTheme;
  ballots: BallotList[];
}> = ({ theme, ballots }) => {
  if (ballots.length == 0 || ballots[0].Ballots.length === 0) {
    return (
      <Container size='xs' px='xs' className={classes.container}>
        <Text>No Ballots Found</Text>
      </Container>
    );
  }
  const { colorScheme } = useMantineColorScheme();
  const getColor = (color: string): string => theme.colors[color][colorScheme === 'dark' ? 5 : 7];

  const items = ballots.map(
    (e: BallotList, i: number): ReactElement => (
      <Fragment key={i}>
        <Accordion.Item value={i.toString()} key={i}>
          <Accordion.Control key={i} icon={<IconChecklist size={26} color={getColor('orange')} />}>
            {moment(e.Ballots[0].DateCreated).format('MMMM DD, YYYY')} -{' '}
            {e.Ballots[0].Election?.Name}
          </Accordion.Control>
          <Accordion.Panel>
            <Table
              key={e.Ballots[0].BallotId}
              withRowBorders={false}
              withColumnBorders={false}
              withTableBorder={false}
            >
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td className={(classes.smallText, classes.tdRight)} c={getColor('orange')}>
                    Ballot Id:
                  </Table.Td>
                  <Table.Td className={(classes.smallText, classes.tdLeft)}>
                    <Text>{e.Ballots[0].BallotId}</Text>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td colSpan={2}>
                    {' '}
                    <Link
                      to={`/ballotview/${e.Ballots[0].BallotId}`}
                      className={classes.buttonText}
                    >
                      <Button
                        fullWidth
                        radius='md'
                        color='green'
                        variant='light'
                        rightSection={<IconZoomIn style={{ width: rem(16), height: rem(16) }} />}
                      >
                        <span className={classes.buttonText}>Details</span>
                      </Button>
                    </Link>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Accordion.Panel>
        </Accordion.Item>
      </Fragment>
    ),
  );

  return (
    <>
      <Accordion
        chevronPosition='right'
        variant='contained'
        chevron={<IconChevronRight size={26} />}
        className={classes.accordion}
      >
        {items}
      </Accordion>
    </>
  );
};
